import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class S3Client {
  private s3: AWS.S3;
  private bucket: string;

  constructor(config: S3Config) {
    this.s3 = new AWS.S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
    this.bucket = config.bucket;
  }

  async uploadBuffer(key: string, buffer: Buffer): Promise<void> {
    try {
      await this.s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      }).promise();
      
      logger.info(`Uploaded to S3: ${key}`);
    } catch (error) {
      logger.error(`Failed to upload to S3 ${key}:`, error);
      throw error;
    }
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    try {
      const result = await this.s3.getObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
      
      return result.Body as Buffer;
    } catch (error) {
      logger.error(`Failed to download from S3 ${key}:`, error);
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
      
      logger.info(`Deleted from S3: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete from S3 ${key}:`, error);
      throw error;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      logger.error(`Failed to generate presigned URL for ${key}:`, error);
      throw error;
    }
  }
}