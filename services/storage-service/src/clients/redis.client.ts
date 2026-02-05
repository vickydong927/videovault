import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisClient {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.sAdd(key, members);
    } catch (error) {
      logger.error(`Failed to add to set ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error(`Failed to get set members ${key}:`, error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    logger.info('Disconnected from Redis');
  }
}