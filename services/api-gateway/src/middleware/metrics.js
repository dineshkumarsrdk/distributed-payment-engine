const client = require('prom-client');

// Initialize default Node.js metrics (CPU, RAM, Event Loop Lag)
client.collectDefaultMetrics({ prefix: 'gateway_' });

// Custom Metric: HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [50, 100, 250, 500, 1000, 2500] // Buckets for response time in ms
});

// Middleware to intercept and measure requests
const metricsMiddleware = (req, res, next) => {
    const startEpoch = Date.now();
    res.on('finish', () => {
        const responseTimeInMs = Date.now() - startEpoch;
        httpRequestDurationMicroseconds
            .labels(req.method, req.path, res.statusCode)
            .observe(responseTimeInMs);
    });

    next();
};

const getMetrics = async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
};

module.exports = { getMetrics, metricsMiddleware };