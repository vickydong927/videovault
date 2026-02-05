import { useState, useEffect } from 'react';
import { VideoItem, CommentItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlayIcon, 
  PauseIcon, 
  ThumbsUpIcon, 
  EyeIcon, 
  MessageCircleIcon, 
  ShareIcon,
  ArrowLeftIcon,
  SendIcon
} from 'lucide-react';
import { videoService } from '@/lib/video-service';

interface VideoPlayerProps {
  video: VideoItem;
  onBack: () => void;
}

const VideoPlayer = ({ video, onBack }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [localLikes, setLocalLikes] = useState<number>(video.likes);
  const [localViews, setLocalViews] = useState<number>(video.views);

  useEffect(() => {
    // Load comments
    const commentsResponse = videoService.getVideoComments(video.id);
    if (commentsResponse.success) {
      setComments(commentsResponse.data);
    }

    // Load current user
    const userResponse = videoService.getCurrentUser();
    if (userResponse.success) {
      setCurrentUser(userResponse.data);
    }

    // Update view count
    videoService.updateVideoViews(video.id);
    setLocalViews(prev => prev + 1);
  }, [video.id]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const handleLike = () => {
    if (!isLiked) {
      videoService.likeVideo(video.id);
      setLocalLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;

    const commentResponse = videoService.addComment({
      videoId: video.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newComment.trim()
    });

    if (commentResponse.success) {
      setComments(prev => [...prev, commentResponse.data]);
      setNewComment('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4 hover:bg-slate-100"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Library
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <Card className="overflow-hidden bg-black">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img 
                src={video.thumbnailUrl} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-white/90 hover:bg-white text-black rounded-full w-16 h-16 p-0"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-8 h-8" />
                  ) : (
                    <PlayIcon className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>
              
              {/* Duration badge */}
              <div className="absolute bottom-4 right-4">
                <Badge className="bg-black/70 text-white">
                  {formatDuration(video.duration)}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Video Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 leading-tight mb-2">
                    {video.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{formatNumber(localViews)} views</span>
                    </div>
                    <span>•</span>
                    <span>Uploaded {formatDate(video.uploadDate)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className={isLiked ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <ThumbsUpIcon className="w-4 h-4 mr-2" />
                    {formatNumber(localLikes)}
                  </Button>
                  <Button variant="outline" size="sm">
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                <Separator />

                {/* Creator info */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={video.creatorAvatar} alt={video.creatorName} />
                    <AvatarFallback className="bg-slate-200 text-slate-600">
                      {video.creatorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {video.creatorName}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircleIcon className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">
                  Comments ({comments.length})
                </h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {/* Add comment */}
              {currentUser && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <SendIcon className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </div>
              )}

              {/* Comments list */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                            {comment.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatTimeAgo(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <ThumbsUpIcon className="w-3 h-3 mr-1" />
                              {comment.likes}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;