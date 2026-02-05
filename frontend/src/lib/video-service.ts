import { VideoItem, UserProfile, CommentItem, LiveStream, UploadProgress, SearchFilters, ApiResponse } from '@/types';
import { mockVideos, mockUsers, mockComments, mockLiveStreams } from './mock-data';

class VideoService {
  private getStorageKey(key: string): string {
    return `video_platform_${key}`;
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return defaultValue;
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }

  // Initialize mock data if not exists
  initializeMockData(): ApiResponse<boolean> {
    try {
      const existingVideos = this.getFromStorage('videos', []);
      const existingUsers = this.getFromStorage('users', []);
      const existingComments = this.getFromStorage('comments', []);
      const existingLiveStreams = this.getFromStorage('live_streams', []);

      if (existingVideos.length === 0) {
        this.saveToStorage('videos', mockVideos);
      }
      if (existingUsers.length === 0) {
        this.saveToStorage('users', mockUsers);
      }
      if (existingComments.length === 0) {
        this.saveToStorage('comments', mockComments);
      }
      if (existingLiveStreams.length === 0) {
        this.saveToStorage('live_streams', mockLiveStreams);
      }

      return { success: true, data: true };
    } catch (error) {
      return { success: false, data: false, message: 'Failed to initialize mock data' };
    }
  }

  // Video operations
  getAllVideos(): ApiResponse<VideoItem[]> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', mockVideos);
      return { success: true, data: videos };
    } catch (error) {
      return { success: false, data: [], message: 'Failed to fetch videos' };
    }
  }

  getVideoById(id: string): ApiResponse<VideoItem | null> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', mockVideos);
      const video = videos.find(v => v.id === id) || null;
      return { success: true, data: video };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to fetch video' };
    }
  }

  searchVideos(query: string, filters?: SearchFilters): ApiResponse<VideoItem[]> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', mockVideos);
      let filteredVideos = videos;

      // Text search
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        filteredVideos = filteredVideos.filter(video => 
          video.title.toLowerCase().includes(searchTerm) ||
          video.description.toLowerCase().includes(searchTerm) ||
          video.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          video.creatorName.toLowerCase().includes(searchTerm)
        );
      }

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        filteredVideos = filteredVideos.filter(video => 
          video.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }

      if (filters?.duration) {
        filteredVideos = filteredVideos.filter(video => {
          const duration = video.duration;
          switch (filters.duration) {
            case 'short': return duration < 300; // Under 5 minutes
            case 'medium': return duration >= 300 && duration < 1200; // 5-20 minutes
            case 'long': return duration >= 1200; // Over 20 minutes
            default: return true;
          }
        });
      }

      // Sort results
      if (filters?.sortBy) {
        filteredVideos.sort((a, b) => {
          switch (filters.sortBy) {
            case 'date':
              return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
            case 'views':
              return b.views - a.views;
            case 'rating':
              return b.likes - a.likes;
            default:
              return 0;
          }
        });
      }

      return { success: true, data: filteredVideos };
    } catch (error) {
      return { success: false, data: [], message: 'Failed to search videos' };
    }
  }

  uploadVideo(videoData: Omit<VideoItem, 'id' | 'uploadDate' | 'views' | 'likes'>): ApiResponse<VideoItem> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', []);
      const newVideo: VideoItem = {
        ...videoData,
        id: `video_${Date.now()}`,
        uploadDate: new Date().toISOString(),
        views: 0,
        likes: 0
      };
      
      videos.unshift(newVideo);
      this.saveToStorage('videos', videos);
      
      return { success: true, data: newVideo };
    } catch (error) {
      return { success: false, data: {} as VideoItem, message: 'Failed to upload video' };
    }
  }

  updateVideoViews(videoId: string): ApiResponse<boolean> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', []);
      const videoIndex = videos.findIndex(v => v.id === videoId);
      
      if (videoIndex !== -1) {
        videos[videoIndex].views += 1;
        this.saveToStorage('videos', videos);
        return { success: true, data: true };
      }
      
      return { success: false, data: false, message: 'Video not found' };
    } catch (error) {
      return { success: false, data: false, message: 'Failed to update views' };
    }
  }

  likeVideo(videoId: string): ApiResponse<boolean> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', []);
      const videoIndex = videos.findIndex(v => v.id === videoId);
      
      if (videoIndex !== -1) {
        videos[videoIndex].likes += 1;
        this.saveToStorage('videos', videos);
        return { success: true, data: true };
      }
      
      return { success: false, data: false, message: 'Video not found' };
    } catch (error) {
      return { success: false, data: false, message: 'Failed to like video' };
    }
  }

  // Live stream operations
  getLiveStreams(): ApiResponse<LiveStream[]> {
    try {
      const streams = this.getFromStorage<LiveStream[]>('live_streams', mockLiveStreams);
      return { success: true, data: streams };
    } catch (error) {
      return { success: false, data: [], message: 'Failed to fetch live streams' };
    }
  }

  // Comment operations
  getVideoComments(videoId: string): ApiResponse<CommentItem[]> {
    try {
      const comments = this.getFromStorage<CommentItem[]>('comments', mockComments);
      const videoComments = comments.filter(c => c.videoId === videoId);
      return { success: true, data: videoComments };
    } catch (error) {
      return { success: false, data: [], message: 'Failed to fetch comments' };
    }
  }

  addComment(commentData: Omit<CommentItem, 'id' | 'timestamp' | 'likes' | 'replies'>): ApiResponse<CommentItem> {
    try {
      const comments = this.getFromStorage<CommentItem[]>('comments', []);
      const newComment: CommentItem = {
        ...commentData,
        id: `comment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      
      comments.push(newComment);
      this.saveToStorage('comments', comments);
      
      return { success: true, data: newComment };
    } catch (error) {
      return { success: false, data: {} as CommentItem, message: 'Failed to add comment' };
    }
  }

  // User operations
  getCurrentUser(): ApiResponse<UserProfile | null> {
    try {
      const currentUser = this.getFromStorage<UserProfile | null>('current_user', mockUsers[0]);
      return { success: true, data: currentUser };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to get current user' };
    }
  }

  // Analytics operations
  getAnalytics(): ApiResponse<any> {
    try {
      const videos = this.getFromStorage<VideoItem[]>('videos', []);
      const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
      const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
      const totalVideos = videos.length;
      
      const analytics = {
        totalVideos,
        totalViews,
        totalLikes,
        averageViews: totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0,
        topVideos: videos.sort((a, b) => b.views - a.views).slice(0, 5),
        recentUploads: videos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).slice(0, 5)
      };
      
      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, data: null, message: 'Failed to fetch analytics' };
    }
  }
}

export const videoService = new VideoService();