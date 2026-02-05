import axios from 'axios';
import { 
  VideoItem, 
  LiveStream, 
  CommentItem, 
  UserProfile, 
  SearchFilters, 
  ApiResponse,
  AnalyticsData,
  ChatMessage
} from '@/types';

class ApiService {
  private api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
          // Optionally redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data as ApiResponse<{ user: UserProfile; token: string }>;
  }

  async signup(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: string;
  }): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    const response = await this.api.post('/auth/signup', userData);
    return response.data as ApiResponse<{ user: UserProfile; token: string }>;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: UserProfile }>> {
    const response = await this.api.get('/auth/me');
    return response.data as ApiResponse<{ user: UserProfile }>;
  }

  // Video methods
  async getVideos(page: number = 1, limit: number = 20): Promise<ApiResponse<VideoItem[]>> {
    const response = await this.api.get(`/videos?page=${page}&limit=${limit}`);
    return response.data as ApiResponse<VideoItem[]>;
  }

  async getVideoById(id: string): Promise<ApiResponse<VideoItem>> {
    const response = await this.api.get(`/videos/${id}`);
    return response.data as ApiResponse<VideoItem>;
  }

  async getPopularVideos(limit: number = 10): Promise<ApiResponse<VideoItem[]>> {
    const response = await this.api.get(`/videos/popular?limit=${limit}`);
    return response.data as ApiResponse<VideoItem[]>;
  }

  async getRecentVideos(limit: number = 10): Promise<ApiResponse<VideoItem[]>> {
    const response = await this.api.get(`/videos/recent?limit=${limit}`);
    return response.data as ApiResponse<VideoItem[]>;
  }

  async getVideosByCreator(creatorId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<VideoItem[]>> {
    const response = await this.api.get(`/videos/creator/${creatorId}?page=${page}&limit=${limit}`);
    return response.data as ApiResponse<VideoItem[]>;
  }

  async uploadVideo(videoData: {
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;
    category: string;
    tags: string[];
  }): Promise<ApiResponse<VideoItem>> {
    const response = await this.api.post('/videos', videoData);
    return response.data as ApiResponse<VideoItem>;
  }

  async incrementVideoViews(videoId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post(`/videos/${videoId}/view`);
    return response.data as ApiResponse<{ message: string }>;
  }

  async likeVideo(videoId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.post(`/videos/${videoId}/like`);
    return response.data as ApiResponse<{ message: string }>;
  }

  async updateVideoStatus(videoId: string, status: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.put(`/videos/${videoId}/status`, { status });
    return response.data as ApiResponse<{ message: string }>;
  }

  // Live stream methods
  async getStreams(status?: string, page: number = 1, limit: number = 20): Promise<ApiResponse<LiveStream[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await this.api.get(`/streams?${params.toString()}`);
    return response.data as ApiResponse<LiveStream[]>;
  }

  async getLiveStreams(): Promise<ApiResponse<LiveStream[]>> {
    const response = await this.api.get('/streams/live');
    return response.data as ApiResponse<LiveStream[]>;
  }

  async getScheduledStreams(): Promise<ApiResponse<LiveStream[]>> {
    const response = await this.api.get('/streams/scheduled');
    return response.data as ApiResponse<LiveStream[]>;
  }

  async getEndedStreams(limit: number = 20): Promise<ApiResponse<LiveStream[]>> {
    const response = await this.api.get(`/streams/ended?limit=${limit}`);
    return response.data as ApiResponse<LiveStream[]>;
  }

  async getStreamById(id: string): Promise<ApiResponse<LiveStream>> {
    const response = await this.api.get(`/streams/${id}`);
    return response.data as ApiResponse<LiveStream>;
  }

  async createStream(streamData: {
    title: string;
    description: string;
    thumbnailUrl: string;
    streamUrl: string;
    startTime: string;
    category: string;
    tags: string[];
    chatEnabled?: boolean;
    recordingEnabled?: boolean;
  }): Promise<ApiResponse<LiveStream>> {
    const response = await this.api.post('/streams', streamData);
    return response.data as ApiResponse<LiveStream>;
  }

  async updateStreamStatus(streamId: string, status: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.put(`/streams/${streamId}/status`, { status });
    return response.data as ApiResponse<{ message: string }>;
  }

  async updateStreamViewers(streamId: string, viewers: number): Promise<ApiResponse<{ message: string }>> {
    const response = await this.api.put(`/streams/${streamId}/viewers`, { viewers });
    return response.data as ApiResponse<{ message: string }>;
  }

  // Chat methods
  async getChatMessages(streamId: string, limit: number = 100): Promise<ApiResponse<ChatMessage[]>> {
    const response = await this.api.get(`/streams/${streamId}/chat?limit=${limit}`);
    return response.data as ApiResponse<ChatMessage[]>;
  }

  async sendChatMessage(streamId: string, message: string, type: string = 'message'): Promise<ApiResponse<ChatMessage>> {
    const response = await this.api.post(`/streams/${streamId}/chat`, { message, type });
    return response.data as ApiResponse<ChatMessage>;
  }

  // Search methods
  async searchVideos(params: {
    query?: string;
    category?: string;
    duration?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<VideoItem[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await this.api.get(`/search/videos?${searchParams.toString()}`);
    return response.data as ApiResponse<VideoItem[]>;
  }

  async searchStreams(params: {
    query?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<LiveStream[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await this.api.get(`/search/streams?${searchParams.toString()}`);
    return response.data as ApiResponse<LiveStream[]>;
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse<string[]>> {
    const response = await this.api.get(`/search/suggestions?query=${encodeURIComponent(query)}`);
    return response.data as ApiResponse<string[]>;
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/search/categories');
    return response.data as ApiResponse<string[]>;
  }

  async getTrendingContent(limit: number = 20): Promise<ApiResponse<{ videos: VideoItem[]; streams: LiveStream[] }>> {
    const response = await this.api.get(`/search/trending?limit=${limit}`);
    return response.data as ApiResponse<{ videos: VideoItem[]; streams: LiveStream[] }>;
  }

  // Analytics methods (mock implementation)
  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    // In a real implementation, this would call a backend analytics endpoint
    // For now, we'll return mock data
    const mockAnalytics: AnalyticsData = {
      totalVideos: 156,
      totalViews: 2340000,
      totalLikes: 45600,
      totalComments: 12300,
      averageViews: 15000,
      topVideos: [],
      recentUploads: [],
      viewsByDate: [],
      popularCategories: [
        { category: 'Technology', count: 45 },
        { category: 'Education', count: 38 },
        { category: 'Business', count: 32 },
        { category: 'Creative', count: 25 },
        { category: 'Science', count: 16 }
      ],
      storageUsage: 1250, // GB
      bandwidthUsage: 5600 // GB
    };
    
    return {
      success: true,
      data: mockAnalytics
    };
  }

  // Comment methods (would be implemented with backend endpoints)
  async getVideoComments(videoId: string): Promise<ApiResponse<CommentItem[]>> {
    // Mock implementation - in real app, this would call backend
    return {
      success: true,
      data: []
    };
  }

  async addComment(videoId: string, content: string, parentId?: string): Promise<ApiResponse<CommentItem>> {
    // Mock implementation - in real app, this would call backend
    const mockComment: CommentItem = {
      id: `comment_${Date.now()}`,
      videoId,
      userId: 'current_user',
      userName: 'Current User',
      userAvatar: '/default-avatar.png',
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
      parentId
    };
    
    return {
      success: true,
      data: mockComment
    };
  }
}

export const apiService = new ApiService();