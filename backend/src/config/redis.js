import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

if (process.env.REDIS_PASSWORD) {
  redisClient.options.password = process.env.REDIS_PASSWORD;
}

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
};

export const disconnectRedis = async () => {
  try {
    await redisClient.quit();
  } catch (err) {
    console.error('Error disconnecting Redis:', err);
  }
};

export default redisClient;
