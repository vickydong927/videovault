import { EtcdClient } from '../clients/etcd.client';
import { RedisClient } from '../clients/redis.client';
import { S3Client } from '../clients/s3.client';
import { ConsistentHashRing, StorageNode } from '../utils/consistent-hash';
import { logger } from '../utils/logger';
import { Counter, Histogram } from 'prom-client';

const segmentStoreCounter = new Counter({
  name: 'storage_segments_stored_total',
  help: 'Total number of segments stored',
  labelNames: ['status'],
});

const segmentRetrieveCounter = new Counter({
  name: 'storage_segments_retrieved_total',
  help: 'Total number of segments retrieved',
  labelNames: ['status'],
});

const storageOperationDuration = new Histogram({
  name: 'storage_operation_duration_seconds',
  help: 'Duration of storage operations',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export interface VideoSegment {
  segmentId: string;
  videoId: string;
  quality: string;
  sequence: number;
  s3Key: string;
  nodeIds: string[];
  size: number;
  createdAt: Date;
}

export class StorageService {
  constructor(
    private etcdClient: EtcdClient,
    private redisClient: RedisClient,
    private s3Client: S3Client,
    private hashRing: ConsistentHashRing
  ) {
    this.initializeStorageNodes();
  }

  private async initializeStorageNodes(): Promise<void> {
    try {
      // Load existing storage nodes from etcd
      const nodes = await this.etcdClient.getPrefix('/storage/nodes/');
      for (const [key, value] of Object.entries(nodes)) {
        const node: StorageNode = JSON.parse(value);
        this.hashRing.addNode(node);
        logger.info(`Loaded storage node: ${node.id}`);
      }
    } catch (error) {
      logger.error('Failed to initialize storage nodes:', error);
    }
  }

  async storeSegment(videoId: string, segmentId: string, data: Buffer): Promise<VideoSegment> {
    const timer = storageOperationDuration.startTimer({ operation: 'store' });
    
    try {
      // Select nodes using consistent hashing with replication
      const nodeIds = this.hashRing.getNodes(segmentId, 3);
      
      if (nodeIds.length === 0) {
        throw new Error('No storage nodes available');
      }

      // Upload to S3 as primary storage
      const s3Key = `segments/${videoId}/${segmentId}`;
      await this.s3Client.uploadBuffer(s3Key, data);

      // Create segment metadata
      const segment: VideoSegment = {
        segmentId,
        videoId,
        quality: '1080p', // This should come from the request
        sequence: 0, // This should come from the request
        s3Key,
        nodeIds,
        size: data.length,
        createdAt: new Date(),
      };

      // Store metadata in etcd
      await this.etcdClient.put(
        `/segments/${segmentId}`,
        JSON.stringify(segment)
      );

      // Cache segment location in Redis
      await this.redisClient.set(
        `segment:${segmentId}`,
        JSON.stringify(segment),
        3600 // 1 hour TTL
      );

      // Update video segments index
      await this.redisClient.sadd(`video:${videoId}:segments`, segmentId);

      segmentStoreCounter.inc({ status: 'success' });
      logger.info(`Stored segment ${segmentId} on nodes: ${nodeIds.join(', ')}`);
      
      return segment;
    } catch (error) {
      segmentStoreCounter.inc({ status: 'failed' });
      logger.error(`Failed to store segment ${segmentId}:`, error);
      throw error;
    } finally {
      timer();
    }
  }

  async getSegment(segmentId: string): Promise<VideoSegment | null> {
    const timer = storageOperationDuration.startTimer({ operation: 'retrieve' });
    
    try {
      // Try cache first
      const cached = await this.redisClient.get(`segment:${segmentId}`);
      if (cached) {
        segmentRetrieveCounter.inc({ status: 'cache_hit' });
        return JSON.parse(cached);
      }

      // Fetch from etcd
      const data = await this.etcdClient.get(`/segments/${segmentId}`);
      if (!data) {
        segmentRetrieveCounter.inc({ status: 'not_found' });
        return null;
      }

      const segment: VideoSegment = JSON.parse(data);
      
      // Update cache
      await this.redisClient.set(
        `segment:${segmentId}`,
        JSON.stringify(segment),
        3600
      );

      segmentRetrieveCounter.inc({ status: 'success' });
      return segment;
    } catch (error) {
      segmentRetrieveCounter.inc({ status: 'failed' });
      logger.error(`Failed to get segment ${segmentId}:`, error);
      throw error;
    } finally {
      timer();
    }
  }

  async getVideoSegments(videoId: string): Promise<VideoSegment[]> {
    try {
      // Get segment IDs from Redis
      const segmentIds = await this.redisClient.smembers(`video:${videoId}:segments`);
      
      // Fetch all segments
      const segments = await Promise.all(
        segmentIds.map(id => this.getSegment(id))
      );

      return segments.filter((s): s is VideoSegment => s !== null);
    } catch (error) {
      logger.error(`Failed to get video segments for ${videoId}:`, error);
      throw error;
    }
  }

  async addStorageNode(nodeId: string, capacity: number, endpoint: string): Promise<void> {
    try {
      const node: StorageNode = {
        id: nodeId,
        capacity,
        endpoint,
        virtualNodes: 150,
      };

      // Add to hash ring
      this.hashRing.addNode(node);

      // Store in etcd
      await this.etcdClient.put(
        `/storage/nodes/${nodeId}`,
        JSON.stringify(node)
      );

      logger.info(`Added storage node: ${nodeId}`);
      
      // Trigger data migration if needed
      await this.migrateDataForNewNode(nodeId);
    } catch (error) {
      logger.error(`Failed to add storage node ${nodeId}:`, error);
      throw error;
    }
  }

  async removeStorageNode(nodeId: string): Promise<void> {
    try {
      // Remove from hash ring
      this.hashRing.removeNode(nodeId);

      // Remove from etcd
      await this.etcdClient.delete(`/storage/nodes/${nodeId}`);

      logger.info(`Removed storage node: ${nodeId}`);
      
      // Trigger data migration to other nodes
      await this.migrateDataFromRemovedNode(nodeId);
    } catch (error) {
      logger.error(`Failed to remove storage node ${nodeId}:`, error);
      throw error;
    }
  }

  async getStorageNodes(): Promise<StorageNode[]> {
    return this.hashRing.getAllNodes();
  }

  private async migrateDataForNewNode(nodeId: string): Promise<void> {
    logger.info(`Starting data migration for new node: ${nodeId}`);
    // Implementation would involve:
    // 1. Identify segments that should now be on this node
    // 2. Copy segments from old nodes to new node
    // 3. Update metadata
    // This is a complex operation that should run asynchronously
  }

  private async migrateDataFromRemovedNode(nodeId: string): Promise<void> {
    logger.info(`Starting data migration from removed node: ${nodeId}`);
    // Implementation would involve:
    // 1. Find all segments on the removed node
    // 2. Redistribute to other nodes using consistent hashing
    // 3. Update metadata
    // This is a complex operation that should run asynchronously
  }
}