const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('[Transaction Service Redis Error]', err));
redisClient.on('connect', () => console.log('[Transaction Service Redis] Connected successfully.'));

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

module.exports = { connectRedis, redisClient };