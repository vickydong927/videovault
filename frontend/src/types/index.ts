export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  uploadDate: string;
  views: number;
  likes: number;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  tags: string[];
  category: string;
  status: 'processing' | 'ready' | 'failed';
  isLive?: boolean;
  liveViewers?: number;
  segments?: VideoSegment[];
  quality?: VideoQuality[];
}

export interface VideoSegment {
  id: string;
  videoId: string;
  segmentNumber: number;
  duration: number;
  url: string;
  nodeId: string;
  checksum: string;
}

export interface VideoQuality {
  resolution: string;
  bitrate: number;
  url: string;
  format: 'dash' | 'hls' | 'mp4';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'creator' | 'viewer' | 'admin' | 'enterprise';
  joinDate: string;
  totalVideos: number;
  totalViews: number;
  subscribers: number;
  permissions: string[];
}

export interface CommentItem {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: CommentItem[];
  parentId?: string;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  streamUrl: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  startTime: string;
  endTime?: string;
  viewers: number;
  category: string;
  tags: string[];
  status: 'scheduled' | 'live' | 'ended';
  chatEnabled: boolean;
  recordingEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'bullet';
}

export interface UploadProgress {
  videoId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  estimatedTime?: string;
  currentSegment?: number;
  totalSegments?: number;
}

export interface SearchFilters {
  category?: string;
  duration?: string;
  uploadDate?: string;
  sortBy?: 'relevance' | 'date' | 'views' | 'rating';
  quality?: string;
  creator?: string;
}

export interface StorageNode {
  id: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  used: number;
  location: string;
  lastHeartbeat: string;
}

export interface DistributionMetrics {
  totalNodes: number;
  activeNodes: number;
  totalStorage: number;
  usedStorage: number;
  replicationFactor: number;
  averageLatency: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'upload_complete' | 'new_comment' | 'live_start' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AnalyticsData {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageViews: number;
  topVideos: VideoItem[];
  recentUploads: VideoItem[];
  viewsByDate: { date: string; views: number }[];
  popularCategories: { category: string; count: number }[];
  storageUsage: number;
  bandwidthUsage: number;
}

export type ViewType = 'library' | 'upload' | 'search' | 'live' | 'profile' | 'analytics' | 'admin';

export type VideoStatus = 'uploading' | 'processing' | 'transcoding' | 'ready' | 'failed';

export type StreamStatus = 'scheduled' | 'starting' | 'live' | 'ending' | 'ended' | 'error';

export type UserRole = 'viewer' | 'creator' | 'moderator' | 'admin' | 'enterprise';

export type NotificationType = 'upload_complete' | 'new_comment' | 'live_start' | 'system' | 'permission_change';