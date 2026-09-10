const axios = require('axios');
const jwt = require('jsonwebtoken');
const { getChannel } = require('../config/rabbitmq');
const { redisClient } = require('../config/redis');
require('dotenv').config();

// Generate a valid system-level JWT to bypass account-service auth
const generateSystemToken = async () => {
  const token = jwt.sign({ userId: 'system-worker' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  // Store in Redis so the account-service stateful auth middleware accepts it
  await redisClient.set('session:system-worker', token, { EX: 3600 });
  return token;
};

const startPaymentProcessor = async () => {
  const channel = getChannel();
  const queue = process.env.QUEUE_NAME;

  // Prefetch ensures the worker only pulls 1 message at a time, preventing memory overload
  await channel.prefetch(1);
  console.log(`[Worker] Listening for messages on queue: ${queue}`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const payload = JSON.parse(msg.content.toString());
      console.log(`[Worker] Received Transaction: ${payload.transactionId}`);

      try {
        // 1. Idempotency Check (Prevent Double Execution)
        const idempotencyKey = `txn:processed:${payload.transactionId}`;
        const isProcessed = await redisClient.get(idempotencyKey);

        if (isProcessed) {
          console.warn(`[Worker] Transaction ${payload.transactionId} already processed. Skipping.`);
          channel.ack(msg); // Acknowledge and remove duplicate from queue
          return;
        }

        // 2. Generate System Token for Inter-Service Auth
        const systemToken = await generateSystemToken();

        // 3. Execute Ledger Transfer in Account Service
        const transferPayload = {
          fromAccountId: payload.fromAccountId,
          toAccountId: payload.toAccountId,
          amount: payload.amount,
          referenceId: payload.referenceId
        };

        await axios.post(`${process.env.ACCOUNT_SERVICE_URL}/accounts/transfer`, transferPayload, {
          headers: { Authorization: `Bearer ${systemToken}` }
        });

        // 4. Mark as Processed in Redis (Lock expires in 24 hours to save memory)
        await redisClient.set(idempotencyKey, 'SUCCESS', { EX: 86400 });

        // 5. Acknowledge message to RabbitMQ
        channel.ack(msg);
        console.log(`[Worker] Successfully processed Transaction: ${payload.transactionId}`);

      } catch (error) {
        console.error(`[Worker] Failed Transaction ${payload.transactionId}:`, error?.response?.data || error.message);
        
        // Reject message and set requeue=false to route it to the Dead Letter Queue (DLQ)
        channel.reject(msg, false);
      }
    }
  });
};

module.exports = { startPaymentProcessor };