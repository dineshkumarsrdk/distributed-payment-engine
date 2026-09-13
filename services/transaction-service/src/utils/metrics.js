const client = require('prom-client');

client.collectDefaultMetrics({ prefix: 'trasaction_service_' });

// Gauge to track Circuit Breaker state (0 = Closed/Healthy, 1 = Open/Failing)
const circuitBreakerState = new client.Gauge({
    name: 'circuit_breaker_state',
    help: 'Current state of the account service circuit breaker',
    labelNames: ['services']
});

// Counter to track RabbitMQ messages processed
const processedMessages = new client.Counter({
    name: 'rabbitmq_messages_processed_total',
    help: 'Total number of transaction messages processed',
    labelNames: ['status']
});

const getMetrics = async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
};

module.exports = { circuitBreakerState, processedMessages, getMetrics };