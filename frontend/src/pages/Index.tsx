import { useState, useEffect } from 'react';
import { VideoItem, LiveStream, ViewType, SearchFilters, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  VideoIcon, 
  UploadIcon, 
  SearchIcon, 
  RadioIcon, 
  UserIcon, 
  BarChart3Icon,
  MenuIcon,
  XIcon,
  PlayIcon,
  EyeIcon,
  ThumbsUpIcon,
  TrendingUpIcon,
  ClockIcon,
  UsersIcon
} from 'lucide-react';
import VideoCard from '@/components/custom/VideoCard';
import VideoPlayer from '@/components/custom/VideoPlayer';
import UploadModal from '@/components/custom/UploadModal';
import { videoService } from '@/lib/video-service';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('library');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() || Object.keys(searchFilters).length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchFilters]);

  const initializeData = async () => {
    setIsLoading(true);
    
    // Initialize mock data
    videoService.initializeMockData();
    
    // Load videos
    const videosResponse = videoService.getAllVideos();
    if (videosResponse.success) {
      setVideos(videosResponse.data);
    }
    
    // Load live streams
    const streamsResponse = videoService.getLiveStreams();
    if (streamsResponse.success) {
      setLiveStreams(streamsResponse.data);
    }
    
    // Load current user
    const userResponse = videoService.getCurrentUser();
    if (userResponse.success) {
      setCurrentUser(userResponse.data);
    }
    
    // Load analytics
    const analyticsResponse = videoService.getAnalytics();
    if (analyticsResponse.success) {
      setAnalytics(analyticsResponse.data);
    }
    
    setIsLoading(false);
  };

  const performSearch = () => {
    const response = videoService.searchVideos(searchQuery, searchFilters);
    if (response.success) {
      setSearchResults(response.data);
    }
  };

  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
  };

  const handleBackToLibrary = () => {
    setSelectedVideo(null);
  };

  const handleUploadComplete = (newVideo: VideoItem) => {
    setVideos(prev => [newVideo, ...prev]);
    setIsUploadModalOpen(false);
  };

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view);
    setSelectedVideo(null);
    setIsMobileMenuOpen(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const navigationItems = [
    { id: 'library', label: 'Video Library', icon: VideoIcon },
    { id: 'upload', label: 'Upload', icon: UploadIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'live', label: 'Live Streams', icon: RadioIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3Icon }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Loading video platform...</p>
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <VideoPlayer video={selectedVideo} onBack={handleBackToLibrary} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <VideoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">VideoStream</h1>
                <p className="text-xs text-slate-500">Distributed Video Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.id as ViewType)}
                    className={currentView === item.id ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-100"}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* User Avatar & Mobile Menu */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <XIcon className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 py-4">
              <nav className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentView === item.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleNavigation(item.id as ViewType)}
                      className={`justify-start ${currentView === item.id ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-100"}`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Library View */}
        {currentView === 'library' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Video Library</h2>
                <p className="text-slate-600">Discover and watch educational content</p>
              </div>
              <Button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </div>

            {/* Featured Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <VideoIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-slate-800">{videos.length}</p>
                  <p className="text-sm text-slate-600">Total Videos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <EyeIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-slate-800">
                    {formatNumber(videos.reduce((sum, v) => sum + v.views, 0))}
                  </p>
                  <p className="text-sm text-slate-600">Total Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <RadioIcon className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold text-slate-800">
                    {liveStreams.filter(s => s.status === 'live').length}
                  </p>
                  <p className="text-sm text-slate-600">Live Now</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-slate-800">
                    {formatNumber(liveStreams.reduce((sum, s) => sum + s.viewers, 0))}
                  </p>
                  <p className="text-sm text-slate-600">Live Viewers</p>
                </CardContent>
              </Card>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoSelect(video)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload View */}
        {currentView === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Your Video</h2>
              <p className="text-slate-600">Share your knowledge with the community</p>
            </div>

            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <UploadIcon className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Ready to upload your content?
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Upload videos up to 2GB in size. Supported formats: MP4, MOV, AVI
                  </p>
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Start Upload
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Uploads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.slice(0, 4).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoSelect(video)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search View */}
        {currentView === 'search' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Search Videos</h2>
              <p className="text-slate-600">Find content by title, description, or tags</p>
            </div>

            {/* Search Form */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={searchFilters.category || ''} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.duration || ''} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, duration: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (under 5 min)</SelectItem>
                      <SelectItem value="medium">Medium (5-20 min)</SelectItem>
                      <SelectItem value="long">Long (over 20 min)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.sortBy || ''} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, sortBy: value as any || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Upload Date</SelectItem>
                      <SelectItem value="views">View Count</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchFilters({});
                      setSearchResults([]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchQuery.trim() || Object.keys(searchFilters).length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoSelect(video)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <SearchIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-600">No videos found matching your search criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <SearchIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-600">Enter a search term to find videos</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Live Streams View */}
        {currentView === 'live' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Live Streams</h2>
              <p className="text-slate-600">Watch live educational content and workshops</p>
            </div>

            <Tabs defaultValue="live" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="live">Live Now</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="ended">Recently Ended</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveStreams.filter(stream => stream.status === 'live').map((stream) => (
                    <VideoCard
                      key={stream.id}
                      liveStream={stream}
                      onClick={() => console.log('Watch live stream:', stream.id)}
                    />
                  ))}
                </div>
                {liveStreams.filter(stream => stream.status === 'live').length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <RadioIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-600">No live streams at the moment</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="scheduled" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveStreams.filter(stream => stream.status === 'scheduled').map((stream) => (
                    <VideoCard
                      key={stream.id}
                      liveStream={stream}
                      onClick={() => console.log('Set reminder for:', stream.id)}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="ended" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveStreams.filter(stream => stream.status === 'ended').map((stream) => (
                    <VideoCard
                      key={stream.id}
                      liveStream={stream}
                      onClick={() => console.log('Watch recording:', stream.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Profile View */}
        {currentView === 'profile' && currentUser && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile</h2>
              <p className="text-slate-600">Manage your account and content</p>
            </div>

            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-2xl">
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{currentUser.name}</h3>
                    <p className="text-slate-600 mb-4">{currentUser.email}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <VideoIcon className="w-4 h-4" />
                        <span>{currentUser.totalVideos} videos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{formatNumber(currentUser.totalViews)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{formatNumber(currentUser.subscribers)} subscribers</span>
                      </div>
                    </div>
                    <Badge className="mt-3 bg-blue-100 text-blue-800">
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Videos */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">My Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.filter(video => video.creatorId === currentUser.id).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoSelect(video)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && analytics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Analytics</h2>
              <p className="text-slate-600">Track your content performance</p>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Videos</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-slate-800">{analytics.totalVideos}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-slate-800">{formatNumber(analytics.totalViews)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Likes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <ThumbsUpIcon className="w-5 h-5 text-red-600" />
                    <span className="text-2xl font-bold text-slate-800">{formatNumber(analytics.totalLikes)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Average Views</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-slate-800">{formatNumber(analytics.averageViews)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Videos */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Performing Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.topVideos.slice(0, 6).map((video: VideoItem) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoSelect(video)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default Index;