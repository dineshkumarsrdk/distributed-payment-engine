const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('[Redis Client Error]', err));
redisClient.on('connect', () => console.log('[Redis Client] Connected successfully.'));

const connectRedis = async () => {
    if(!redisClient.isOpen) {
        await redisClient.connect();
    }
};

module.exports = { redisClient, connectRedis };