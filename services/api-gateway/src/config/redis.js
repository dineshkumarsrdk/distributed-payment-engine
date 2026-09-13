const { createClient } = require('redis');

const redisClient = createClient({ url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` });

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    console.log('[API Gateway Redis] Connected for Rate Limiting.');
};

redisClient.on('error', (err) => console.error('[Gateway Redis Error]', err));

module.exports = { connectRedis, redisClient };