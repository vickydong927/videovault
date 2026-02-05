import { pgTable, text, timestamp, integer, boolean, jsonb, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table with string UUID
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('viewer'),
  permissions: jsonb('permissions').default([]),
  totalVideos: integer('total_videos').default(0),
  totalViews: integer('total_views').default(0),
  subscribers: integer('subscribers').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Videos table
export const videos = pgTable('videos', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  videoUrl: text('video_url').notNull(),
  duration: integer('duration').notNull(), // in seconds
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  creatorId: text('creator_id').notNull().references(() => users.id),
  tags: jsonb('tags').default([]),
  category: text('category').notNull(),
  status: text('status').notNull().default('processing'),
  quality: jsonb('quality').default([]), // VideoQuality[]
  segments: jsonb('segments').default([]), // VideoSegment[]
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Live streams table
export const liveStreams = pgTable('live_streams', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  streamUrl: text('stream_url').notNull(),
  creatorId: text('creator_id').notNull().references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  viewers: integer('viewers').default(0),
  maxViewers: integer('max_viewers').default(0),
  category: text('category').notNull(),
  tags: jsonb('tags').default([]),
  status: text('status').notNull().default('scheduled'),
  chatEnabled: boolean('chat_enabled').default(true),
  recordingEnabled: boolean('recording_enabled').default(true),
  recordingUrl: text('recording_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: text('id').primaryKey().notNull(),
  videoId: text('video_id').references(() => videos.id),
  streamId: text('stream_id').references(() => liveStreams.id),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentId: text('parent_id').references(() => comments.id),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat messages for live streams
export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey().notNull(),
  streamId: text('stream_id').notNull().references(() => liveStreams.id),
  userId: text('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  type: text('type').notNull().default('message'), // 'message' | 'system' | 'bullet'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Storage nodes for distributed storage
export const storageNodes = pgTable('storage_nodes', {
  id: text('id').primaryKey().notNull(),
  url: text('url').notNull(),
  status: text('status').notNull().default('active'),
  capacity: integer('capacity').notNull(), // in GB
  used: integer('used').default(0), // in GB
  location: text('location').notNull(),
  lastHeartbeat: timestamp('last_heartbeat').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Video segments for distributed storage
export const videoSegments = pgTable('video_segments', {
  id: text('id').primaryKey().notNull(),
  videoId: text('video_id').notNull().references(() => videos.id),
  segmentNumber: integer('segment_number').notNull(),
  duration: decimal('duration', { precision: 10, scale: 3 }).notNull(),
  url: text('url').notNull(),
  nodeId: text('node_id').notNull().references(() => storageNodes.id),
  checksum: text('checksum').notNull(),
  size: integer('size').notNull(), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics events table
export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey().notNull(),
  eventType: text('event_type').notNull(), // 'view', 'like', 'comment', 'upload', etc.
  entityType: text('entity_type').notNull(), // 'video', 'stream', 'user'
  entityId: text('entity_id').notNull(),
  userId: text('user_id').references(() => users.id),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['viewer', 'creator', 'enterprise']).default('viewer'),
});

export const insertVideoSchema = createInsertSchema(videos, {
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL'),
  videoUrl: z.string().url('Invalid video URL'),
  duration: z.coerce.number().int().positive('Duration must be positive'),
  category: z.string().min(1, 'Category is required'),
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams, {
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL'),
  streamUrl: z.string().url('Invalid stream URL'),
  category: z.string().min(1, 'Category is required'),
});

export const insertCommentSchema = createInsertSchema(comments, {
  content: z.string().min(1, 'Comment cannot be empty'),
});

// Login schemas
export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
    role: z.enum(['viewer', 'creator', 'enterprise']).default('viewer'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Search schema
export const searchVideoSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  duration: z.enum(['short', 'medium', 'long']).optional(),
  sortBy: z.enum(['relevance', 'date', 'views', 'rating']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = typeof liveStreams.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type StorageNode = typeof storageNodes.$inferSelect;
export type VideoSegment = typeof videoSegments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;
export type SearchVideoInput = z.infer<typeof searchVideoSchema>;