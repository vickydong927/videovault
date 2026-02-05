import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { register } from 'prom-client';
import { StorageService } from './services/storage.service';
import { ConsistentHashRing } from './utils/consistent-hash';
import { EtcdClient } from './clients/etcd.client';
import { RedisClient } from './clients/redis.client';
import { S3Client } from './clients/s3.client';
import { logger } from './utils/logger';
import { config } from './config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// Initialize clients
const etcdClient = new EtcdClient(config.etcd.endpoints);
const redisClient = new RedisClient(config.redis.url);
const s3Client = new S3Client(config.aws);
const hashRing = new ConsistentHashRing();
const storageService = new StorageService(etcdClient, redisClient, s3Client, hashRing);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'storage-service' });
});

app.get('/ready', async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: (error as Error).message });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Storage API endpoints
app.post('/api/segments', async (req, res) => {
  try {
    const { videoId, segmentId, data } = req.body;
    const result = await storageService.storeSegment(videoId, segmentId, data);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to store segment:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/segments/:segmentId', async (req, res) => {
  try {
    const { segmentId } = req.params;
    const segment = await storageService.getSegment(segmentId);
    if (!segment) {
      return res.status(404).json({ success: false, error: 'Segment not found' });
    }
    res.json({ success: true, data: segment });
  } catch (error) {
    logger.error('Failed to get segment:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/videos/:videoId/segments', async (req, res) => {
  try {
    const { videoId } = req.params;
    const segments = await storageService.getVideoSegments(videoId);
    res.json({ success: true, data: segments });
  } catch (error) {
    logger.error('Failed to get video segments:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Storage node management
app.post('/api/nodes', async (req, res) => {
  try {
    const { nodeId, capacity, endpoint } = req.body;
    await storageService.addStorageNode(nodeId, capacity, endpoint);
    res.json({ success: true, message: 'Storage node added' });
  } catch (error) {
    logger.error('Failed to add storage node:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/api/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    await storageService.removeStorageNode(nodeId);
    res.json({ success: true, message: 'Storage node removed' });
  } catch (error) {
    logger.error('Failed to remove storage node:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/nodes', async (req, res) => {
  try {
    const nodes = await storageService.getStorageNodes();
    res.json({ success: true, data: nodes });
  } catch (error) {
    logger.error('Failed to get storage nodes:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`Storage Service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.disconnect();
  process.exit(0);
});