import React from 'react';
import { VideoCard } from '../components/shared/VideoCard';

export function TrendingPage() {
  // Mock trending videos
  const trendingVideos = [
    {
      id: 't1',
      did: 'did:plc:abc123',
      handle: '@alice.skippster.social',
      title: 'Welcome to Skippster Tube - Your Decentralized Video Platform',
      duration: 180,
      views: 125000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 't2',
      did: 'did:plc:def456',
      handle: '@bob.creator',
      title: 'How to Get Started with Web3 Development',
      duration: 1200,
      views: 89000,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      monetizationType: 'donations' as const,
    },
    {
      id: 't3',
      did: 'did:plc:ghi789',
      handle: '@charlie.tube',
      title: 'Building P2P Applications with libp2p',
      duration: 900,
      views: 67000,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 't4',
      did: 'did:plc:jkl012',
      handle: '@diana.dev',
      title: 'React 18 Features You Need to Know',
      duration: 600,
      views: 56000,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 't5',
      did: 'did:plc:mno345',
      handle: '@evan.tech',
      title: 'TypeScript Best Practices for 2024',
      duration: 750,
      views: 48000,
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      monetizationType: 'subscription' as const,
    },
    {
      id: 't6',
      did: 'did:plc:pqr678',
      handle: '@fiona.crypto',
      title: 'Understanding Lightning Network Payments',
      duration: 540,
      views: 42000,
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 't7',
      did: 'did:plc:stu901',
      handle: '@george.ai',
      title: 'Building AI Agents with Skippster',
      duration: 1080,
      views: 38000,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      monetizationType: 'payperview' as const,
    },
    {
      id: 't8',
      did: 'did:plc:vwx234',
      handle: '@hannah.des',
      title: 'UI/UX Design Principles for Web Apps',
      duration: 840,
      views: 35000,
      createdAt: new Date(Date.now() - 691200000).toISOString(),
      monetizationType: 'free' as const,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Trending</h1>
          <p className="text-gray-400">What's hot on Skippster Tube</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-tube-500 text-white rounded-full text-sm font-medium">
            Now
          </button>
          <button className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] text-white rounded-full text-sm font-medium transition-colors">
            Today
          </button>
          <button className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] text-white rounded-full text-sm font-medium transition-colors">
            This Week
          </button>
          <button className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] text-white rounded-full text-sm font-medium transition-colors">
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trendingVideos.map((video, index) => (
          <div key={video.id} className="relative">
            {index < 3 && (
              <span className="absolute top-2 left-2 bg-tube-500 text-white text-xs px-2 py-0.5 rounded-full font-bold z-10">
                #{index + 1}
              </span>
            )}
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}