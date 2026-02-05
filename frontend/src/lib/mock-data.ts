import { VideoItem, UserProfile, CommentItem, LiveStream } from '@/types';

// Mock users
export const mockUsers: UserProfile[] = [
  {
    id: 'user_1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'creator',
    joinDate: '2023-01-15T00:00:00Z',
    totalVideos: 24,
    totalViews: 125000,
    subscribers: 8500,
    permissions: ['upload', 'stream', 'moderate']
  },
  {
    id: 'user_2',
    name: 'Prof. Michael Rodriguez',
    email: 'michael.rodriguez@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'creator',
    joinDate: '2023-02-20T00:00:00Z',
    totalVideos: 18,
    totalViews: 89000,
    subscribers: 6200,
    permissions: ['upload', 'stream']
  },
  {
    id: 'user_3',
    name: 'Emily Johnson',
    email: 'emily.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    joinDate: '2023-03-10T00:00:00Z',
    totalVideos: 32,
    totalViews: 156000,
    subscribers: 12000,
    permissions: ['upload', 'stream', 'moderate', 'admin']
  },
  {
    id: 'user_4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'creator',
    joinDate: '2023-04-05T00:00:00Z',
    totalVideos: 15,
    totalViews: 67000,
    subscribers: 4800,
    permissions: ['upload', 'stream']
  }
];

// Mock videos
export const mockVideos: VideoItem[] = [
  {
    id: 'video_1',
    title: 'Introduction to Distributed Systems Architecture',
    description: 'Learn the fundamentals of distributed systems, including consistency models, fault tolerance, and scalability patterns. This comprehensive guide covers CAP theorem, consensus algorithms, and real-world implementation strategies.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 1847, // 30:47
    uploadDate: '2024-01-15T10:30:00Z',
    views: 15420,
    likes: 892,
    creatorId: 'user_1',
    creatorName: 'Dr. Sarah Chen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    tags: ['distributed-systems', 'architecture', 'scalability', 'microservices'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_2',
    title: 'Advanced Video Processing with FFmpeg and DASH',
    description: 'Deep dive into video transcoding, adaptive bitrate streaming, and DASH protocol implementation. Learn how to optimize video delivery for different devices and network conditions.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    duration: 2156, // 35:56
    uploadDate: '2024-01-12T14:15:00Z',
    views: 8934,
    likes: 567,
    creatorId: 'user_2',
    creatorName: 'Prof. Michael Rodriguez',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    tags: ['ffmpeg', 'video-processing', 'dash', 'streaming'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_3',
    title: 'Building Scalable Real-time Chat Systems',
    description: 'Learn how to build real-time messaging systems using WebSockets, message queues, and distributed architectures. Covers scaling strategies and performance optimization.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 1623, // 27:03
    uploadDate: '2024-01-10T09:45:00Z',
    views: 12567,
    likes: 734,
    creatorId: 'user_3',
    creatorName: 'Emily Johnson',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    tags: ['websockets', 'real-time', 'chat', 'scalability'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_4',
    title: 'Kubernetes for Video Platform Deployment',
    description: 'Complete guide to deploying video platforms on Kubernetes. Covers container orchestration, auto-scaling, service mesh integration, and monitoring strategies.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    duration: 2834, // 47:14
    uploadDate: '2024-01-08T16:20:00Z',
    views: 9876,
    likes: 623,
    creatorId: 'user_4',
    creatorName: 'David Kim',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    tags: ['kubernetes', 'deployment', 'containers', 'devops'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_5',
    title: 'Machine Learning for Content Recommendation',
    description: 'Implement intelligent content discovery using machine learning algorithms. Learn about collaborative filtering, content-based recommendations, and hybrid approaches.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 2145, // 35:45
    uploadDate: '2024-01-05T11:30:00Z',
    views: 7234,
    likes: 456,
    creatorId: 'user_1',
    creatorName: 'Dr. Sarah Chen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    tags: ['machine-learning', 'recommendations', 'ai', 'algorithms'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_6',
    title: 'Enterprise Video Security and Access Control',
    description: 'Comprehensive guide to securing video content in enterprise environments. Covers authentication, authorization, DRM, and compliance requirements.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    duration: 1956, // 32:36
    uploadDate: '2024-01-03T13:15:00Z',
    views: 5678,
    likes: 342,
    creatorId: 'user_3',
    creatorName: 'Emily Johnson',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    tags: ['security', 'enterprise', 'access-control', 'drm'],
    category: 'Business',
    status: 'ready'
  },
  {
    id: 'video_7',
    title: 'Live Streaming Architecture and CDN Integration',
    description: 'Learn how to build robust live streaming infrastructure with CDN integration, edge computing, and global content delivery optimization.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 2267, // 37:47
    uploadDate: '2024-01-01T15:45:00Z',
    views: 11234,
    likes: 678,
    creatorId: 'user_2',
    creatorName: 'Prof. Michael Rodriguez',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    tags: ['live-streaming', 'cdn', 'edge-computing', 'infrastructure'],
    category: 'Technology',
    status: 'ready'
  },
  {
    id: 'video_8',
    title: 'Data Analytics for Video Platforms',
    description: 'Implement comprehensive analytics for video platforms. Learn about user behavior tracking, content performance metrics, and business intelligence.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    duration: 1789, // 29:49
    uploadDate: '2023-12-28T10:20:00Z',
    views: 6789,
    likes: 423,
    creatorId: 'user_4',
    creatorName: 'David Kim',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    tags: ['analytics', 'data-science', 'metrics', 'business-intelligence'],
    category: 'Business',
    status: 'ready'
  }
];

// Mock live streams
export const mockLiveStreams: LiveStream[] = [
  {
    id: 'stream_1',
    title: 'Live: Building Microservices with Docker',
    description: 'Join us for a live coding session where we build and deploy microservices using Docker containers and Kubernetes orchestration.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=225&fit=crop',
    streamUrl: 'https://live-stream-example.com/stream1',
    creatorId: 'user_1',
    creatorName: 'Dr. Sarah Chen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    startTime: '2024-01-20T14:00:00Z',
    viewers: 1247,
    category: 'Technology',
    tags: ['microservices', 'docker', 'kubernetes', 'live-coding'],
    status: 'live',
    chatEnabled: true,
    recordingEnabled: true
  },
  {
    id: 'stream_2',
    title: 'Enterprise Training: Video Platform Security',
    description: 'Comprehensive training session on implementing security best practices for enterprise video platforms and content protection.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=225&fit=crop',
    streamUrl: 'https://live-stream-example.com/stream2',
    creatorId: 'user_3',
    creatorName: 'Emily Johnson',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    startTime: '2024-01-21T10:00:00Z',
    viewers: 892,
    category: 'Business',
    tags: ['security', 'enterprise', 'training', 'best-practices'],
    status: 'live',
    chatEnabled: true,
    recordingEnabled: true
  },
  {
    id: 'stream_3',
    title: 'Scheduled: Advanced Streaming Protocols',
    description: 'Deep dive into modern streaming protocols including WebRTC, RTMP, and HLS. Learn when and how to use each protocol effectively.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=225&fit=crop',
    streamUrl: 'https://live-stream-example.com/stream3',
    creatorId: 'user_2',
    creatorName: 'Prof. Michael Rodriguez',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    startTime: '2024-01-22T16:00:00Z',
    viewers: 0,
    category: 'Technology',
    tags: ['streaming', 'protocols', 'webrtc', 'rtmp'],
    status: 'scheduled',
    chatEnabled: true,
    recordingEnabled: true
  },
  {
    id: 'stream_4',
    title: 'Recently Ended: Platform Monitoring Workshop',
    description: 'Workshop on implementing comprehensive monitoring and alerting for distributed video platforms using modern observability tools.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    streamUrl: 'https://live-stream-example.com/stream4',
    creatorId: 'user_4',
    creatorName: 'David Kim',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    startTime: '2024-01-18T13:00:00Z',
    endTime: '2024-01-18T15:30:00Z',
    viewers: 0,
    category: 'Technology',
    tags: ['monitoring', 'observability', 'workshop', 'devops'],
    status: 'ended',
    chatEnabled: true,
    recordingEnabled: true
  }
];

// Mock comments
export const mockComments: CommentItem[] = [
  {
    id: 'comment_1',
    videoId: 'video_1',
    userId: 'user_2',
    userName: 'Prof. Michael Rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    content: 'Excellent explanation of distributed systems concepts! The CAP theorem section was particularly well done.',
    timestamp: '2024-01-16T09:15:00Z',
    likes: 23,
    replies: []
  },
  {
    id: 'comment_2',
    videoId: 'video_1',
    userId: 'user_4',
    userName: 'David Kim',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    content: 'Could you do a follow-up video on consensus algorithms like Raft and PBFT?',
    timestamp: '2024-01-16T14:30:00Z',
    likes: 15,
    replies: [
      {
        id: 'comment_2_reply_1',
        videoId: 'video_1',
        userId: 'user_1',
        userName: 'Dr. Sarah Chen',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        content: 'Great suggestion! I\'ll add that to my content roadmap.',
        timestamp: '2024-01-16T16:45:00Z',
        likes: 8,
        replies: [],
        parentId: 'comment_2'
      }
    ]
  },
  {
    id: 'comment_3',
    videoId: 'video_2',
    userId: 'user_3',
    userName: 'Emily Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    content: 'The DASH implementation examples are very practical. We\'re implementing this in our enterprise platform.',
    timestamp: '2024-01-13T11:20:00Z',
    likes: 19,
    replies: []
  },
  {
    id: 'comment_4',
    videoId: 'video_3',
    userId: 'user_1',
    userName: 'Dr. Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    content: 'Love the real-time architecture patterns shown here. The WebSocket scaling strategies are spot on!',
    timestamp: '2024-01-11T08:45:00Z',
    likes: 27,
    replies: []
  }
];