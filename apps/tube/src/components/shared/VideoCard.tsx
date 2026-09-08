import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Share2 } from 'lucide-react';
import type { Video, MonetizationType } from '../../types/video';

/**
 * Video with creator info for display in cards.
 * Uses structural typing (not extending Video) because card display only
 * needs the render fields, createdAt may arrive as ISO string (API JSON)
 * or Date, and mock/demo pages don't carry every DB field.
 */
export interface VideoWithCreator {
  id: string;
  did: string;
  handle: string;
  title: string;
  duration: number;
  views: number;
  createdAt: Date | string;
  monetizationType?: MonetizationType;
  description?: string | null;
  thumbnailCid?: string | null;
  thumbnail?: string;
  magnetLink?: string;
}

interface VideoCardProps {
  video: VideoWithCreator;
  onShareToSocial?: (video: VideoWithCreator) => void;
}

export function VideoCard({ video, onShareToSocial }: VideoCardProps) {
  const [showShareTooltip, setShowShareTooltip] = React.useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatTimeAgo = (date: Date | string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShareToSocial?.(video);
  };

  const thumbnailStyle = video.thumbnail
    ? { backgroundImage: `url(${video.thumbnail})` }
    : { background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' };

  return (
    <Link to={`/watch/${video.id}`} className="block group cursor-pointer">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
          style={thumbnailStyle}
        >
          {!video.thumbnail && (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayIcon />
            </div>
          )}
        </div>
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </span>
        {video.monetizationType !== 'free' && (
          <span className="absolute top-2 right-2 bg-tube-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {video.monetizationType === 'donations' ? '💖' : '🔒'}
          </span>
        )}

        {/* Share to Social button - appears on hover */}
        {onShareToSocial && (
          <div
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseEnter={() => setShowShareTooltip(true)}
            onMouseLeave={() => setShowShareTooltip(false)}
          >
            <button
              onClick={handleShare}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share to Social
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-9 h-9 bg-gray-700 rounded-full" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-tube-500 transition-colors">
            {video.title}
          </h3>
          <p className="text-gray-400 text-xs">{video.handle}</p>
          <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViews(video.views)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlayIcon() {
  return (
    <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}