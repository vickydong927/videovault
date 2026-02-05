import { VideoItem, LiveStream } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayIcon, EyeIcon, ThumbsUpIcon, ClockIcon, UsersIcon } from 'lucide-react';

interface VideoCardProps {
  video?: VideoItem;
  liveStream?: LiveStream;
  onClick: () => void;
  className?: string;
}

const VideoCard = ({ video, liveStream, onClick, className = '' }: VideoCardProps) => {
  const isLive = !!liveStream;
  const item = video || liveStream;
  
  if (!item) return null;

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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white border border-slate-200 min-h-[320px] flex flex-col ${className}`}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={item.thumbnailUrl} 
          alt={item.title}
          className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Overlay with play button */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <PlayIcon className="w-6 h-6 text-slate-700" />
          </div>
        </div>
        
        {/* Duration or Live badge */}
        <div className="absolute bottom-2 right-2">
          {isLive ? (
            <Badge className="bg-red-600 text-white hover:bg-red-700 font-medium px-2 py-1">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          ) : video && (
            <Badge className="bg-black/70 text-white hover:bg-black/80 font-medium px-2 py-1">
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatDuration(video.duration)}
            </Badge>
          )}
        </div>
        
        {/* Processing status */}
        {video?.status === 'processing' && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 font-medium px-2 py-1">
              Processing
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={item.creatorAvatar} alt={item.creatorName} />
            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
              {item.creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {item.creatorName}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2 flex-1">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {isLive ? (
              <div className="flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                <span>{formatNumber(liveStream.viewers)} watching</span>
              </div>
            ) : video && (
              <>
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  <span>{formatNumber(video.views)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUpIcon className="w-3 h-3" />
                  <span>{formatNumber(video.likes)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="text-xs text-slate-400">
            {isLive ? (
              liveStream.status === 'live' ? 'Live now' : 
              liveStream.status === 'scheduled' ? 'Scheduled' : 'Ended'
            ) : video && (
              formatDate(video.uploadDate)
            )}
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 2).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              {tag}
            </Badge>
          ))}
          {item.tags.length > 2 && (
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600"
            >
              +{item.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;