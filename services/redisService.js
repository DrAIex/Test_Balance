const { createClient } = require('redis');

console.log('Initializing Redis client...');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('connect', () => {
    console.log('Redis client connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis client connected and ready');
});

redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});

redisClient.on('end', () => {
    console.log('Redis connection ended');
});

redisClient.connect()
    .then(() => console.log('Redis connection established'))
    .catch(err => console.error('Redis connection error:', err));

module.exports = { redisClient };
