export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  etcd: {
    endpoints: (process.env.ETCD_ENDPOINTS || 'localhost:2379').split(','),
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'video-platform-storage',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  
  storage: {
    segmentPath: process.env.SEGMENT_PATH || '/data/segments',
    replicationFactor: parseInt(process.env.REPLICATION_FACTOR || '3', 10),
  },
};