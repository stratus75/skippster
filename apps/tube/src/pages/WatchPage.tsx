import React from 'react';
import { useParams } from 'react-router-dom';
import { ThumbsUp, Share, Download, MoreVertical } from 'lucide-react';

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();

  // Mock video data
  const video = {
    id: videoId || '1',
    did: 'did:plc:abc123',
    handle: '@alice.skippster.social',
    title: 'Welcome to Skippster Tube - Your Decentralized Video Platform',
    description: 'Welcome to Skippster Tube, your decentralized video platform built on P2P technology. Learn about our features, how to upload videos, and join our community.',
    duration: 180,
    views: 12500,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    monetizationType: 'free' as const,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <div className="flex-1">
        {/* Video Player */}
        <div className="video-player-container rounded-lg overflow-hidden mb-4">
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-gray-400">Video Player (WebTorrent)</p>
          </div>
        </div>

        {/* Video Info */}
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div>
                  <p className="font-medium">{video.handle}</p>
                  <p className="text-sm text-gray-400">12.5K subscribers</p>
                </div>
              </div>
              <button className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <ThumbsUp className="w-5 h-5" />
                <span>1.2K</span>
              </button>
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <Share className="w-5 h-5" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
              <button className="bg-[#272727] hover:bg-[#3d3d3d] p-2 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#272727] rounded-lg p-4 mb-4">
          <p className="font-medium mb-2">
            {video.views.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}
          </p>
          <p className="whitespace-pre-wrap text-sm">{video.description}</p>
        </div>

        {/* Comments */}
        <div>
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">@user{i}</span>
                    <span className="text-sm text-gray-400">2 days ago</span>
                  </div>
                  <p className="text-sm">Great video! Thanks for sharing this with the community.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <h2 className="text-lg font-bold mb-4">Related Videos</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-2 cursor-pointer hover:bg-[#272727] rounded-lg p-2 transition-colors">
              <div className="aspect-video w-40 bg-gray-800 rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2 mb-1">
                  Related Video {i} - This is a placeholder title for related content
                </p>
                <p className="text-xs text-gray-400">@creator{i}</p>
                <p className="text-xs text-gray-400">{(i * 10)}K views • {i} days ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}