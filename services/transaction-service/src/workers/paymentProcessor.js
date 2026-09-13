const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getChannel } = require('../config/rabbitmq');
const { redisClient } = require('../config/redis');
const { acquireLock, releaseLock } = require('../utils/distributedLock');
const { handleProcessingFailure } = require('../utils/retryHandler');
const { accountTransferBreaker } = require('../utils/circuitBreaker');
const logger = require('../utils/logger');

// Generate a valid system-level JWT to bypass account-service auth
const generateSystemToken = async () => {
  const token = jwt.sign({ userId: 'system-worker' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  // Store in Redis so the account-service stateful auth middleware accepts it
  await redisClient.set('session:system-worker', token, { EX: 3600 });
  return token;
};

// Simulated downstream External Clearing House
// const mockExternalClearing = async (transactionId) => {
// Simulate a 50% failure rate to test our Saga compensation
// const isSuccess = Math.random() > 0.5;
// const isSuccess = false;
// if (!isSuccess) throw new Error('External clearing network timeout or rejection.');
//   return true;
// };

const startPaymentProcessor = async () => {
  const channel = getChannel();
  const queue = process.env.QUEUE_NAME;

  // Prefetch ensures the worker only pulls 1 message at a time, preventing memory overload
  await channel.prefetch(1);
  console.log(`[Worker] Listening for messages on queue: ${queue}`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const payload = JSON.parse(msg.content.toString());
      const correlationId = msg.properties.headers?.['x-correlation-id']
      logger.info(correlationId, `[Worker] Received Transaction: ${payload.transactionId}`);
      let sourceLockToken = null;
      let targetLockToken = null;
      try {
        // 1. Idempotency Check (Prevent Double Execution)
        const idempotencyKey = `txn:processed:${payload.transactionId}`;
        const isProcessed = await redisClient.get(idempotencyKey);

        if (isProcessed) {
          logger.warn(correlationId, `[Worker] Transaction ${payload.transactionId} already processed. Skipping.`);
          channel.ack(msg); // Acknowledge and remove duplicate from queue
          return;
        }

        const accountIds = [payload.fromAccountId, payload.toAccountId].sort((a, b) => a - b);

        sourceLockToken = await acquireLock(`account:${accountIds[0]}`, 10000);
        targetLockToken = await acquireLock(`account:${accountIds[1]}`, 10000);

        if (!sourceLockToken || !targetLockToken) {
          logger.warn(`[Worker] Could not acquire distributed locks for accounts [${accountIds.join(', ')}]. Requeueing message.`);
          // Release any lock that was partially acquired
          if (sourceLockToken) await releaseLock(`account:${accountIds[0]}`, sourceLockToken);
          if (targetLockToken) await releaseLock(`account:${accountIds[1]}`, targetLockToken);

          // Requeue message after short delay to allow the active worker to finish
          setTimeout(() => channel.nack(msg, false, true), 500);
          return;
        }

        logger.info(correlationId, `[Worker] Locks acquired for accounts [${accountIds.join(', ')}]. Processing TXN: ${payload.transactionId}`);

        // 2. Generate System Token for Inter-Service Auth
        const systemToken = await generateSystemToken();

        // 3. Execute Ledger Transfer in Account Service
        const transferPayload = {
          fromAccountId: payload.fromAccountId,
          toAccountId: payload.toAccountId,
          amount: payload.amount,
          referenceId: payload.referenceId
        };

        // await axios.post(`${process.env.ACCOUNT_SERVICE_URL}/accounts/transfer`, transferPayload, {
        //   headers: { Authorization: `Bearer ${systemToken}` }
        // });
        // replacing axios call with circuit breaker
        await accountTransferBreaker.fire({
          url: `${process.env.ACCOUNT_SERVICE_URL}/accounts/transfer`,
          payload: transferPayload,
          headers: { Authorization: `Bearer ${systemToken}`, 'x-correlation-id': correlationId }
        });

        // try {
        //   await mockExternalClearing(payload.transactionId);
        //   await redisClient.set(idempotencyKey, 'SUCCESS', { EX: 86400 });
        //   channel.ack(msg);
        //   console.log(`[Worker] Transaction ${payload.transactionId} fully settled.`);
        // } catch (clearingError) {
        //   // SAGA FAILURE COMPENSATING ACTION
        //   console.warn(`[Worker] Downstream failure for ${payload.transactionId}. Initiating Saga Compensation...`);

        //   await axios.post(`${process.env.ACCOUNT_SERVICE_URL}/accounts/compensate`,
        //     {
        //       originalReferenceId: payload.referenceId,
        //       reason: clearingError.message
        //     },
        //     {
        //       headers: { Authorization: `Bearer ${systemToken}` }
        //     }
        //   );

        //   await redisClient.set(idempotencyKey, 'COMPENSATED', { EX: 86400 });
        //   channel.ack(msg); // Message processed, state safely reverted
        //   console.log(`[Worker] Saga Compensation complete for ${payload.transactionId}. Funds safely reverted.`);
        // }

        await redisClient.set(idempotencyKey, 'SUCCESS', { EX: 86400 });
        channel.ack(msg);
        logger.info(correlationId, `[Worker] Successfully processed Transaction: ${payload.transactionId}`);

      } catch (error) {
        logger.error(correlationId, `[Worker] Failed Transaction ${payload.transactionId}:`, error?.response?.data || error.message);
        // Delegate failure handling to Exponential Backoff Engine
        await handleProcessingFailure(msg, error);
        // Reject message and set requeue=false to route it to the Dead Letter Queue (DLQ)
        // channel.reject(msg, false);
      } finally {
        const accountIds = [payload.fromAccountId, payload.toAccountId].sort((a, b) => a - b);
        if (sourceLockToken) await releaseLock(`account:${accountIds[0]}`, sourceLockToken);
        if (targetLockToken) await releaseLock(`account:${accountIds[1]}`, targetLockToken);
      }
    }
  });
};

module.exports = { startPaymentProcessor };