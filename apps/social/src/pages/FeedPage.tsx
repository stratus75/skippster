import React from 'react';
import { useFeed } from '../hooks';
import { PostCard } from '../components/shared/PostCard';
import type { Post } from '../types';

// Mock user DID - in real app, this would come from auth
const MOCK_USER_DID = 'did:plc:test-user-001';

export function FeedPage() {
  const { posts, isLoading, error, hasMore, loadFeed, createNewPost, toggleLike } = useFeed(MOCK_USER_DID);
  const [newPostContent, setNewPostContent] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  // Load feed on mount
  React.useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setIsCreating(true);
    try {
      await createNewPost(newPostContent.trim());
      setNewPostContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Find post to check if it's liked
      const post = posts.find((p) => p.id === postId);
      const isLiked = false; // TODO: Track like state per post
      await toggleLike(postId, isLiked);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Open comment modal/navigate to post detail
  };

  const handleShare = (postId: string) => {
    // TODO: Open share dialog
  };

  // Group posts by date for better UX
  const groupedPosts = React.useMemo(() => {
    const groups: { [key: string]: Post[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    posts.forEach((post) => {
      const postDate = new Date(post.createdAt).toDateString();
      let groupKey: string;

      if (postDate === today) {
        groupKey = 'Today';
      } else if (postDate === yesterday) {
        groupKey = 'Yesterday';
      } else {
        groupKey = new Date(post.createdAt).toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(post);
    });

    return groups;
  }, [posts]);

  return (
    <div className="p-4">
      {/* Create Post */}
      <div className="bg-[#242526] rounded-lg shadow-md mb-4 p-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-social-500 rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-[#3a3b3c] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-social-500"
              rows={3}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#3a3b3c] rounded transition-colors">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#3a3b3c] rounded transition-colors">
                  <div className="w-5 h-5 bg-tube-500 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-white">T</span>
                  </div>
                  <span className="text-sm">Video</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#3a3b3c] rounded transition-colors">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">File</span>
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isCreating}
                className="bg-social-500 hover:bg-social-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
              >
                {isCreating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-social-500"></div>
        </div>
      )}

      {/* Posts grouped by date */}
      {Object.entries(groupedPosts).map(([date, datePosts]) => (
        <div key={date} className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">{date}</h2>
          <div className="space-y-4">
            {datePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={{
                  name: 'User',
                  handle: `@${post.did.slice(0, 12)}...`,
                }}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => loadFeed(false)}
            disabled={isLoading}
            className="bg-[#3a3b3c] hover:bg-[#4e4f50] px-6 py-2 rounded font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No posts yet</p>
          <p className="text-gray-400 text-sm">Be the first to post something!</p>
        </div>
      )}
    </div>
  );
}