const amqp = require('amqplib');
require('dotenv').config();

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
    try {
        const amqpUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`
        connection = await amqp.connect(amqpUrl);
        channel = await connection.createChannel();
        console.log('[Transaction Service RabbitMQ] Connected successfully.');

        // Assert Dead Letter Exchange (DLX) & Dead Letter Queue (DLQ) for unprocessable messages
        await channel.assertExchange(process.env.DLX_NAME, 'direct', { durable: true });
        await channel.assertQueue(process.env.DLQ_NAME, { durable: true });
        await channel.bindQueue(process.env.DLQ_NAME, process.env.DLX_NAME, process.env.DLQ_ROUTING_KEY);

        // Assert Primary Exchange (Direct Type)
        await channel.assertExchange(process.env.EXCHANGE_NAME, 'direct', { durable: true });
        // Assert Primary Queue with DLX Binding
        // Unhandled or rejected messages will automatically route to DLX after retries
        await channel.assertQueue(process.env.QUEUE_NAME,
            {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': process.env.DLX_NAME,
                    'x-dead-letter-routing-key': process.env.DLQ_ROUTING_KEY,
                }
            },
        );
        // Bind Primary Queue to Main Exchange
        await channel.bindQueue(process.env.QUEUE_NAME, process.env.EXCHANGE_NAME, process.env.ROUTING_KEY);

        // Assert retry exchange and queue
        // Messages in retry_queue expire after TTL and dead-letter BACK to the primary exchange
        await channel.assertExchange(process.env.RTX_NAME, 'direct', { durable: true });
        await channel.assertQueue(process.env.RTQ_NAME, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': process.env.EXCHANGE_NAME, // Routes back to main exchange on expiry
                'x-dead-letter-routing-key': process.env.ROUTING_KEY
            }
        });
        await channel.bindQueue(process.env.RTQ_NAME, process.env.RTX_NAME, process.env.RTQ_ROUTING_KEY);

        console.log('[Transaction Service RabbitMQ] Exchanges & Queues (Main, Retry, DLQ) asserted.');
    } catch (error) {
        console.error('[Transaction Service RabbitMQ] Connection failure:', error);
        process.exit(1);
    }
}

const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel has not been initialized.');
    }
    return channel;
}

module.exports = { connectRabbitMQ, getChannel };