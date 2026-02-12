const redis = require('redis');
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', err => console.log('Redis Error', err));
module.exports = redisClient;