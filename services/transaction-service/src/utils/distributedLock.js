const crypto = require('crypto');
const { redisClient } = require('../config/redis');

/**
 * Acquires a distributed lock for a specific resource key.
 * @param {string} resource - Identifier (e.g., 'account:1')
 * @param {number} ttlMs - Lock expiration time in milliseconds (default: 5000ms)
 * @returns {string|null} Lock token if acquired, null if already locked
 */
const acquireLock = async (resource, ttlMs = 5000) => {
    const lockKey = `lock:${resource}`;
    const token = crypto.randomBytes(16).toString('hex');

    const result = await redisClient.set(lockKey, token, {
        NX: true,
        PX: ttlMs
    });

    if (result === 'OK') {
        return token;
    }
    return null;
};

/**
 * Releases a distributed lock safely using an atomic Lua script.
 * @param {string} resource - Identifier
 * @param {string} token - The lock token returned during acquireLock
 */

const releaseLock = async (resource, token) => {
    const lockKey = `lock:${resource}`;

    // Atomic Lua script: Releases lock ONLY if the token matches (prevents releasing someone else's lock)
    const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

    try {
        await redisClient.eval(luaScript, {
            keys: [lockKey],
            arguments: [token],
        });
    } catch (error) {
        console.error(`[Distributed Lock] Error releasing lock for ${lockKey}:`, error);
    }
};

module.exports = { acquireLock, releaseLock };