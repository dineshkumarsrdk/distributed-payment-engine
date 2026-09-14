const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const correlationId = req.headers['x-coorelation-id'];
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(correlationId, 'HTTP Request completed', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration
        });
    });

    next();
};

module.exports = { requestLogger };