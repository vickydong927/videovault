import { db } from '../db/db';
import { liveStreams, users, chatMessages, analyticsEvents, InsertLiveStream, insertLiveStreamSchema } from '../db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { z } from 'zod';

export class StreamRepository {
  async create(streamData: z.infer<typeof insertLiveStreamSchema> & { creatorId: string }): Promise<any> {
    const streamId = crypto.randomUUID();
    
    const [stream] = await db
      .insert(liveStreams)
      .values({
        id: streamId,
        ...streamData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InsertLiveStream)
      .returning();

    // Create analytics event
    await db.insert(analyticsEvents).values({
      id: crypto.randomUUID(),
      eventType: 'stream_create',
      entityType: 'stream',
      entityId: streamId,
      userId: streamData.creatorId,
      createdAt: new Date(),
    });

    return this.getStreamWithCreator(streamId);
  }

  async findAll(status?: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    if (status) {
      whereConditions.push(eq(liveStreams.status, status));
    }
    
    const result = await db
      .select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        thumbnailUrl: liveStreams.thumbnailUrl,
        streamUrl: liveStreams.streamUrl,
        startTime: liveStreams.startTime,
        endTime: liveStreams.endTime,
        viewers: liveStreams.viewers,
        maxViewers: liveStreams.maxViewers,
        category: liveStreams.category,
        tags: liveStreams.tags,
        status: liveStreams.status,
        chatEnabled: liveStreams.chatEnabled,
        recordingEnabled: liveStreams.recordingEnabled,
        recordingUrl: liveStreams.recordingUrl,
        createdAt: liveStreams.createdAt,
        updatedAt: liveStreams.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(liveStreams)
      .leftJoin(users, eq(liveStreams.creatorId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(liveStreams.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.formatStreamResponse);
  }

  async findById(id: string): Promise<any | null> {
    return this.getStreamWithCreator(id);
  }

  async findByCreatorId(creatorId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const offset = (page - 1) * limit;
    
    const result = await db
      .select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        thumbnailUrl: liveStreams.thumbnailUrl,
        streamUrl: liveStreams.streamUrl,
        startTime: liveStreams.startTime,
        endTime: liveStreams.endTime,
        viewers: liveStreams.viewers,
        maxViewers: liveStreams.maxViewers,
        category: liveStreams.category,
        tags: liveStreams.tags,
        status: liveStreams.status,
        chatEnabled: liveStreams.chatEnabled,
        recordingEnabled: liveStreams.recordingEnabled,
        recordingUrl: liveStreams.recordingUrl,
        createdAt: liveStreams.createdAt,
        updatedAt: liveStreams.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(liveStreams)
      .leftJoin(users, eq(liveStreams.creatorId, users.id))
      .where(eq(liveStreams.creatorId, creatorId))
      .orderBy(desc(liveStreams.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.formatStreamResponse);
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        updatedAt: new Date()
      };
      
      // Set end time when stream ends
      if (status === 'ended') {
        updateData.endTime = new Date();
      }
      
      await db
        .update(liveStreams)
        .set(updateData)
        .where(eq(liveStreams.id, id));
      
      // Create analytics event
      await db.insert(analyticsEvents).values({
        id: crypto.randomUUID(),
        eventType: `stream_${status}`,
        entityType: 'stream',
        entityId: id,
        createdAt: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating stream status:', error);
      return false;
    }
  }

  async updateViewers(id: string, viewers: number): Promise<boolean> {
    try {
      // Get current max viewers
      const [currentStream] = await db
        .select({ maxViewers: liveStreams.maxViewers })
        .from(liveStreams)
        .where(eq(liveStreams.id, id))
        .limit(1);
      
      const updateData: any = {
        viewers,
        updatedAt: new Date()
      };
      
      // Update max viewers if current viewers is higher
      if (currentStream && viewers > (currentStream.maxViewers || 0)) {
        updateData.maxViewers = viewers;
      }
      
      await db
        .update(liveStreams)
        .set(updateData)
        .where(eq(liveStreams.id, id));
      
      return true;
    } catch (error) {
      console.error('Error updating stream viewers:', error);
      return false;
    }
  }

  async getLiveStreams(): Promise<any[]> {
    return this.findAll('live');
  }

  async getScheduledStreams(): Promise<any[]> {
    return this.findAll('scheduled');
  }

  async getEndedStreams(limit: number = 20): Promise<any[]> {
    const result = await db
      .select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        thumbnailUrl: liveStreams.thumbnailUrl,
        streamUrl: liveStreams.streamUrl,
        startTime: liveStreams.startTime,
        endTime: liveStreams.endTime,
        viewers: liveStreams.viewers,
        maxViewers: liveStreams.maxViewers,
        category: liveStreams.category,
        tags: liveStreams.tags,
        status: liveStreams.status,
        chatEnabled: liveStreams.chatEnabled,
        recordingEnabled: liveStreams.recordingEnabled,
        recordingUrl: liveStreams.recordingUrl,
        createdAt: liveStreams.createdAt,
        updatedAt: liveStreams.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(liveStreams)
      .leftJoin(users, eq(liveStreams.creatorId, users.id))
      .where(eq(liveStreams.status, 'ended'))
      .orderBy(desc(liveStreams.endTime))
      .limit(limit);

    return result.map(this.formatStreamResponse);
  }

  // Chat message methods
  async addChatMessage(streamId: string, userId: string, message: string, type: string = 'message'): Promise<any> {
    const messageId = crypto.randomUUID();
    
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        id: messageId,
        streamId,
        userId,
        message,
        type,
        createdAt: new Date(),
      })
      .returning();

    // Get user info for the response
    const [user] = await db
      .select({ name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      id: chatMessage.id,
      streamId: chatMessage.streamId,
      userId: chatMessage.userId,
      userName: user?.name || 'Unknown User',
      userAvatar: user?.avatar || '/default-avatar.png',
      message: chatMessage.message,
      type: chatMessage.type,
      timestamp: chatMessage.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async getChatMessages(streamId: string, limit: number = 100): Promise<any[]> {
    const result = await db
      .select({
        id: chatMessages.id,
        streamId: chatMessages.streamId,
        userId: chatMessages.userId,
        message: chatMessages.message,
        type: chatMessages.type,
        createdAt: chatMessages.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.streamId, streamId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return result.map(msg => ({
      id: msg.id,
      streamId: msg.streamId,
      userId: msg.userId,
      userName: msg.userName || 'Unknown User',
      userAvatar: msg.userAvatar || '/default-avatar.png',
      message: msg.message,
      type: msg.type,
      timestamp: msg.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  private async getStreamWithCreator(id: string): Promise<any | null> {
    const result = await db
      .select({
        id: liveStreams.id,
        title: liveStreams.title,
        description: liveStreams.description,
        thumbnailUrl: liveStreams.thumbnailUrl,
        streamUrl: liveStreams.streamUrl,
        startTime: liveStreams.startTime,
        endTime: liveStreams.endTime,
        viewers: liveStreams.viewers,
        maxViewers: liveStreams.maxViewers,
        category: liveStreams.category,
        tags: liveStreams.tags,
        status: liveStreams.status,
        chatEnabled: liveStreams.chatEnabled,
        recordingEnabled: liveStreams.recordingEnabled,
        recordingUrl: liveStreams.recordingUrl,
        createdAt: liveStreams.createdAt,
        updatedAt: liveStreams.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorAvatar: users.avatar,
      })
      .from(liveStreams)
      .leftJoin(users, eq(liveStreams.creatorId, users.id))
      .where(eq(liveStreams.id, id))
      .limit(1);

    return result.length > 0 ? this.formatStreamResponse(result[0]) : null;
  }

  private formatStreamResponse(stream: any): any {
    return {
      id: stream.id,
      title: stream.title,
      description: stream.description,
      thumbnailUrl: stream.thumbnailUrl,
      streamUrl: stream.streamUrl,
      creatorId: stream.creatorId,
      creatorName: stream.creatorName || 'Unknown Creator',
      creatorAvatar: stream.creatorAvatar || '/default-avatar.png',
      startTime: stream.startTime?.toISOString() || new Date().toISOString(),
      endTime: stream.endTime?.toISOString(),
      viewers: stream.viewers || 0,
      maxViewers: stream.maxViewers || 0,
      category: stream.category,
      tags: Array.isArray(stream.tags) ? stream.tags : [],
      status: stream.status,
      chatEnabled: stream.chatEnabled || false,
      recordingEnabled: stream.recordingEnabled || false,
      recordingUrl: stream.recordingUrl,
    };
  }
}

export const streamRepository = new StreamRepository();