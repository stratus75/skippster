import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { VideoEmbed } from './VideoEmbed';
import type { Post } from '../../types';

interface ReactionInfo {
  emoji: string;
  count: number;
}

export interface PostCardProps {
  post: Post;
  author?: {
    name: string;
    handle: string;
    avatar?: string;
  };
  reactions?: ReactionInfo[];
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({
  post,
  author,
  reactions,
  isLiked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  onLike,
  onComment,
  onShare,
}: PostCardProps) {
  const [liked, setLiked] = React.useState(isLiked);
  const [likes, setLikes] = React.useState(likeCount);

  const handleLike = () => {
    if (!onLike) return;
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    onLike(post.id);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  // Default author if not provided
  const displayName = author?.name || 'Unknown User';
  const displayHandle = author?.handle || `@${post.did.slice(0, 12)}...`;

  return (
    <div className="bg-[#242526] rounded-lg shadow-md mb-4">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 bg-[#3a3b3c] rounded-full flex-shrink-0 overflow-hidden">
          {author?.avatar ? (
            <img src={author.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-social-500/20 flex items-center justify-center">
              <span className="text-social-500 font-bold">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium hover:underline cursor-pointer">{displayName}</p>
          <p className="text-xs text-gray-500">{displayHandle} · {formatTimeAgo(post.createdAt)}</p>
        </div>
        <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaCids && post.mediaCids.length > 0 && (
        <div className="grid gap-1 p-1">
          {post.mediaCids.length === 1 && (
            <div className="aspect-[4/3] bg-[#3a3b3c] rounded" />
          )}
          {post.mediaCids.length === 2 && (
            <div className="grid grid-cols-2 gap-1">
              <div className="aspect-square bg-[#3a3b3c] rounded" />
              <div className="aspect-square bg-[#3a3b3c] rounded" />
            </div>
          )}
          {post.mediaCids.length > 2 && (
            <div className="grid grid-cols-2 gap-1">
              {post.mediaCids.slice(0, 3).map((_, i) => (
                <div key={i} className={`aspect-square bg-[#3a3b3c] rounded ${i === 2 ? 'relative' : ''}`}>
                  {i === 2 && post.mediaCids && post.mediaCids.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-2xl font-bold">+{post.mediaCids.length - 3}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Embed */}
      {post.videoId && (
        <div className="px-1">
          <VideoEmbed videoId={post.videoId} />
        </div>
      )}

      {/* Reactions Summary */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-[#3e4042]">
        <div className="flex items-center gap-2">
          {reactions && reactions.length > 0 ? (
            reactions.map((r, i) => (
              <span key={i} className="flex items-center gap-1">
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))
          ) : (
            likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>{likes}</span>
              </span>
            )
          )}
        </div>
        <div className="flex gap-4">
          <span>{commentCount} comments</span>
          <span>{shareCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-[#3e4042]">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors ${
            liked ? 'text-social-500' : ''
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </button>
        <button
          onClick={() => onComment?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}