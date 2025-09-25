const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

const redis = new Redis(config.redisUrl, { lazyConnect: true });

async function connect() {
  try {
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available: ' + e.message);
  }
}

async function get(key) {
  try {
    await connect();
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

async function set(key, value, ttlSec = 3600) {
  try {
    await connect();
    await redis.setex(key, ttlSec, JSON.stringify(value));
  } catch (e) {
    // ignore cache failures
  }
}

module.exports = { get, set };
