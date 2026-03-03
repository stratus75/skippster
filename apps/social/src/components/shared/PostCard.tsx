import React from 'react';

export interface Post {
  id: string;
  authorDID: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  content: string;
  media?: string[];
  videoId?: string;
  privacy: 'public' | 'friends' | 'group';
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-[#242526] rounded-lg shadow-md mb-4">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 bg-[#3a3b3c] rounded-full flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium hover:underline cursor-pointer">{post.authorName}</p>
          <p className="text-xs text-gray-500">{post.authorHandle} · {formatTimeAgo(post.createdAt)}</p>
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
      {post.media && post.media.length > 0 && (
        <div className="grid gap-1 p-1">
          {post.media.length === 1 && (
            <div className="aspect-[4/3] bg-[#3a3b3c] rounded" />
          )}
          {post.media.length === 2 && (
            <div className="grid grid-cols-2 gap-1">
              <div className="aspect-square bg-[#3a3b3c] rounded" />
              <div className="aspect-square bg-[#3a3b3c] rounded" />
            </div>
          )}
          {post.media.length > 2 && (
            <div className="grid grid-cols-2 gap-1">
              {post.media.slice(0, 3).map((_, i) => (
                <div key={i} className={`aspect-square bg-[#3a3b3c] rounded ${i === 2 ? 'relative' : ''}`}>
                  {i === 2 && post.media.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-2xl font-bold">+{post.media.length - 3}</span>
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
        <div className="p-1">
          <div className="aspect-video bg-[#0f0f0f] rounded flex items-center justify-center">
            <p className="text-gray-500 flex items-center gap-2">
              <span className="w-6 h-6 bg-tube-500 rounded flex items-center justify-center text-xs">T</span>
              Embedded Video from Tube
            </p>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-[#3e4042]">
        <span>{post.likes > 0 && `${post.likes} likes`}</span>
        <div className="flex gap-4">
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-[#3e4042]">
        <button
          onClick={() => onLike?.(post.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors ${
            post.isLiked ? 'text-social-500' : ''
          }`}
        >
          <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Like</span>
        </button>
        <button
          onClick={() => onComment?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Comment</span>
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-[#3a3b3c] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}