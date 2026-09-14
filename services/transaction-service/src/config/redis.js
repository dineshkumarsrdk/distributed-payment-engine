const { createClient } = require('redis');
const logger = require('../utils/logger');
require('dotenv').config();

const redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => logger.error('system', '[Transaction Service Redis Error]', err));
redisClient.on('connect', () => logger.info('system', '[Transaction Service Redis] Connected successfully.'));

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

module.exports = { connectRedis, redisClient };