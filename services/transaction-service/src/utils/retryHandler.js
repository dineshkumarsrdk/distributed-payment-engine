const { getChannel } = require('../config/rabbitmq');
require('dotenv').config();

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

/**
 * Handles transient failure retries using exponential backoff and DLQ fallback.
 * @param {object} msg - Raw AMQP message object
 * @param {Error} error - Error thrown during processing
 */
const handleProcessingFailure = async (msg, error) => {
    const channel = getChannel();
    const headers = msg.properties.headers || {};
    const currentRetry = (headers['x-retry-count'] || 0) + 1;
    const payload = JSON.parse(msg.content.toString());

    if (currentRetry <= MAX_RETRIES) {
        // Exponential Backoff calculation: 2s, 4s, 8s
        const delayMs = Math.pow(2, currentRetry - 1) * BASE_DELAY_MS;
        console.warn(`[Retry Engine] Retrying TXN: ${payload.transactionId} | Attempt ${currentRetry}/${MAX_RETRIES} | Delay: ${delayMs}ms | Reason: ${error.message}`);

        channel.publish(
            process.env.RTX_NAME,
            process.env.RTQ_ROUTING_KEY,
            msg.content,
            {
                persistent: true,
                expiration: delayMs.toString(), // Message TTL before returning to primary queue
                headers: {
                    ...headers,
                    'x-retry-count': currentRetry,
                    'x-last-error': error.message
                },
            }
        );
        // Acknowledge original message to remove it from the primary queue while it waits in retry queue
        channel.ack(msg);
    } else {
        console.error(`[Retry Engine] Exceeded Max Retries (${MAX_RETRIES}) for TXN: ${payload.transactionId}. Routing to DLQ.`);

        // Reject message without requeueing -> RabbitMQ automatically routes it to DLX -> DLQ
        channel.reject(msg, false);
    }
};

module.exports = { handleProcessingFailure };