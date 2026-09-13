const { getChannel } = require('../config/rabbitmq');
const logger = require('./logger');
require('dotenv').config();

/**
 * Publishes an event to the RabbitMQ exchange.
 * @param {string} routingKey - Routing key for message routing
 * @param {object} payload - Event payload data
 */

const publishEvent = async (routingKey, payload, correlationId) => {
    try {
        const channel = getChannel();
        const exchange = process.env.EXCHANGE_NAME;

        const messageBuffer = Buffer.from(JSON.stringify(payload));

        const published = channel.publish(exchange, routingKey, messageBuffer, {
            persistent: true,
            contentType: 'application/json',
            timestamp: Date.now(),
            headers: {
                'x-correlation-id': correlationId, // Attach trace header to RabbitMQ envelope
            }
        });

        if (published) {
            logger.info(correlationId, `[Producer] Published event [${routingKey}] successfully: ${payload.transactionId}`);
        } else {
            logger.warn(correlationId, `[Producer] Message buffer full while publishing event [${routingKey}]`);
        }
        return published;
    } catch (error) {
        logger.error(`[Producer Error] Failed to publish event [${routingKey}]:`, error);
        throw error;
    }
};

module.exports = { publishEvent };