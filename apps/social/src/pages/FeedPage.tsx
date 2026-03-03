import React from 'react';
import { PostCard } from './PostCard';

export function FeedPage() {
  const [posts] = React.useState([
    {
      id: '1',
      authorDID: 'did:plc:abc123',
      authorName: 'Alice Creator',
      authorHandle: '@alice.skippster.social',
      content: 'Just uploaded a new video to Skippster Tube! Check it out and let me know what you think! 🎥 #Skippster #Video',
      privacy: 'public' as const,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 124,
      comments: 23,
      shares: 8,
      videoId: '1',
    },
    {
      id: '2',
      authorDID: 'did:plc:def456',
      authorName: 'Bob Developer',
      authorHandle: '@bob.creator',
      content: 'Working on a new web3 project using libp2p. The P2P capabilities are amazing! Check out the Skippster core modules if you want to learn more about decentralized networking.',
      privacy: 'public' as const,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 89,
      comments: 15,
      shares: 4,
    },
    {
      id: '3',
      authorDID: 'did:plc:ghi789',
      authorName: 'Charlie Tech',
      authorHandle: '@charlie.tube',
      content: 'Just finished building my first Solana dapp! The escrow functionality for the Skippster marketplace is going to be game-changing for P2P transactions.',
      privacy: 'public' as const,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      likes: 256,
      comments: 42,
      shares: 19,
    },
  ]);

  const handleLike = (postId: string) => {
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
  };

  return (
    <div className="p-4">
      {/* Create Post */}
      <div className="bg-[#242526] rounded-lg shadow-md mb-4 p-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-[#3a3b3c] rounded-full flex-shrink-0" />
          <div className="flex-1">
            <input
              type="text"
              placeholder="What's on your mind?"
              className="text-base mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#3a3b3c] rounded transition-colors">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Document</span>
                </button>
              </div>
              <button className="bg-social-500 hover:bg-social-600 px-4 py-2 rounded font-medium transition-colors">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        ))}
      </div>
    </div>
  );
}