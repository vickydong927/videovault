import { Etcd3 } from 'etcd3';
import { logger } from '../utils/logger';

export class EtcdClient {
  private client: Etcd3;

  constructor(endpoints: string[]) {
    this.client = new Etcd3({
      hosts: endpoints,
    });
  }

  async put(key: string, value: string): Promise<void> {
    try {
      await this.client.put(key).value(value);
    } catch (error) {
      logger.error(`Failed to put key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key).string();
      return value;
    } catch (error) {
      logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.delete().key(key);
    } catch (error) {
      logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async getPrefix(prefix: string): Promise<Record<string, string>> {
    try {
      const result = await this.client.getAll().prefix(prefix).strings();
      return result;
    } catch (error) {
      logger.error(`Failed to get prefix ${prefix}:`, error);
      throw error;
    }
  }

  async watch(key: string, callback: (value: string) => void): Promise<void> {
    const watcher = await this.client.watch().key(key).create();
    
    watcher.on('put', (res) => {
      callback(res.value.toString());
    });
  }
}