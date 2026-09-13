const { randomUUID } = require('crypto');

const correlationIdMiddleware = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || `corr-${randomUUID()}`;
    // req.headers will be transferred to the proxyreq.headers
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
};

module.exports = { correlationIdMiddleware };