import { db } from '../db/db';
import { videos, users, comments, analyticsEvents, InsertVideo, insertVideoSchema } from '../db/schema';
import { eq, desc, asc, like, and, or, sql, count } from 'drizzle-orm';
import { SearchVideoInput } from '../db/schema';
import { z } from 'zod';

export class VideoRepository {
  async create(videoData: z.infer<typeof insertVideoSchema> & { creatorId: string }): Promise<any> {
    const videoId = crypto.randomUUID();
    
    const [video] = await db
      .insert(videos)
      .values({
        id: videoId,
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InsertVideo)
      .returning();

    // Create analytics event
    await db.insert(analyticsEvents).values({
      id: crypto.randomUUID(),
      eventType: 'upload',
      entityType: 'video',
      entityId: videoId,
      userId: videoData.creatorId,
      createdAt: new Date(),
    });

    return this.getVideoWithCreator(videoId);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<any[]> {
    const offset = (page - 1) * limit;
    
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.status, 'ready'))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.formatVideoResponse);
  }

  async findById(id: string): Promise<any | null> {
    return this.getVideoWithCreator(id);
  }

  async findByCreatorId(creatorId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const offset = (page - 1) * limit;
    
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.creatorId, creatorId))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.formatVideoResponse);
  }

  async search(searchParams: SearchVideoInput): Promise<{ videos: any[], total: number }> {
    const { query, category, duration, sortBy, page = 1, limit = 20 } = searchParams;
    const offset = (page - 1) * limit;
    
    let whereConditions = [eq(videos.status, 'ready')];
    
    // Text search
    if (query) {
      whereConditions.push(
        or(
          like(videos.title, `%${query}%`),
          like(videos.description, `%${query}%`),
          sql`${videos.tags}::text ILIKE ${'%' + query + '%'}`
        )
      );
    }
    
    // Category filter
    if (category && category !== 'all') {
      whereConditions.push(eq(videos.category, category));
    }
    
    // Duration filter
    if (duration) {
      switch (duration) {
        case 'short':
          whereConditions.push(sql`${videos.duration} < 300`);
          break;
        case 'medium':
          whereConditions.push(sql`${videos.duration} >= 300 AND ${videos.duration} < 1200`);
          break;
        case 'long':
          whereConditions.push(sql`${videos.duration} >= 1200`);
          break;
      }
    }
    
    // Build order by clause
    let orderBy;
    switch (sortBy) {
      case 'date':
        orderBy = desc(videos.createdAt);
        break;
      case 'views':
        orderBy = desc(videos.views);
        break;
      case 'rating':
        orderBy = desc(videos.likes);
        break;
      default:
        orderBy = desc(videos.createdAt);
    }
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(videos)
      .where(and(...whereConditions));
    
    // Get videos
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    return {
      videos: result.map(this.formatVideoResponse),
      total: totalResult.count
    };
  }

  async incrementViews(id: string): Promise<boolean> {
    try {
      await db
        .update(videos)
        .set({ 
          views: sql`${videos.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(videos.id, id));
      
      // Create analytics event
      await db.insert(analyticsEvents).values({
        id: crypto.randomUUID(),
        eventType: 'view',
        entityType: 'video',
        entityId: id,
        createdAt: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return false;
    }
  }

  async incrementLikes(id: string, userId?: string): Promise<boolean> {
    try {
      await db
        .update(videos)
        .set({ 
          likes: sql`${videos.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(videos.id, id));
      
      // Create analytics event
      await db.insert(analyticsEvents).values({
        id: crypto.randomUUID(),
        eventType: 'like',
        entityType: 'video',
        entityId: id,
        userId: userId,
        createdAt: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing likes:', error);
      return false;
    }
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    try {
      await db
        .update(videos)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(videos.id, id));
      
      return true;
    } catch (error) {
      console.error('Error updating video status:', error);
      return false;
    }
  }

  async getPopularVideos(limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.status, 'ready'))
      .orderBy(desc(videos.views))
      .limit(limit);

    return result.map(this.formatVideoResponse);
  }

  async getRecentVideos(limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.status, 'ready'))
      .orderBy(desc(videos.createdAt))
      .limit(limit);

    return result.map(this.formatVideoResponse);
  }

  private async getVideoWithCreator(id: string): Promise<any | null> {
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        views: videos.views,
        likes: videos.likes,
        tags: videos.tags,
        category: videos.category,
        status: videos.status,
        quality: videos.quality,
        segments: videos.segments,
        metadata: videos.metadata,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(videos)
      .leftJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.id, id))
      .limit(1);

    return result.length > 0 ? this.formatVideoResponse(result[0]) : null;
  }

  private formatVideoResponse(video: any): any {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      uploadDate: video.createdAt?.toISOString() || new Date().toISOString(),
      views: video.views || 0,
      likes: video.likes || 0,
      creatorId: video.creatorId,
      creatorName: video.creatorName || 'Unknown Creator',
      creatorAvatar: video.creatorAvatar || '/default-avatar.png',
      tags: Array.isArray(video.tags) ? video.tags : [],
      category: video.category,
      status: video.status,
      quality: Array.isArray(video.quality) ? video.quality : [],
      segments: Array.isArray(video.segments) ? video.segments : [],
      metadata: video.metadata || {},
    };
  }
}

export const videoRepository = new VideoRepository();