import React from 'react';
import { VideoCard } from './VideoCard';

export function SubscriptionsPage() {
  // Mock channels
  const channels = [
    { did: 'did:plc:def456', handle: '@bob.creator', name: 'Bob Developer', avatar: '', videos: 45 },
    { did: 'did:plc:ghi789', handle: '@charlie.tube', name: 'Charlie Tech', avatar: '', videos: 32 },
    { did: 'did:plc:jkl012', handle: '@diana.dev', name: 'Diana Designs', avatar: '', videos: 28 },
    { did: 'did:plc:mno345', handle: '@evan.tech', name: 'Evan Engineer', avatar: '', videos: 67 },
    { did: 'did:plc:pqr678', handle: '@fiona.crypto', name: 'Fiona Finance', avatar: '', videos: 19 },
  ];

  // Mock recent videos from subscriptions
  const recentVideos = [
    {
      id: 's1',
      did: 'did:plc:def456',
      handle: '@bob.creator',
      title: 'Advanced TypeScript Patterns',
      duration: 900,
      views: 23400,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 's2',
      did: 'did:plc:ghi789',
      handle: '@charlie.tube',
      title: 'Building with React Server Components',
      duration: 720,
      views: 18700,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 's3',
      did: 'did:plc:mno345',
      handle: '@evan.tech',
      title: 'State Management in 2024',
      duration: 600,
      views: 31200,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      monetizationType: 'donations' as const,
    },
    {
      id: 's4',
      did: 'did:plc:jkl012',
      handle: '@diana.dev',
      title: 'Design Systems Best Practices',
      duration: 840,
      views: 15600,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      monetizationType: 'free' as const,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Subscriptions</h1>

      {/* Channels Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Channels</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {channels.map((channel) => (
            <div key={channel.did} className="bg-[#1f1f1f] rounded-lg p-4 hover:bg-[#272727] transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-3" />
              <p className="font-medium text-center text-sm">{channel.name}</p>
              <p className="text-xs text-gray-400 text-center">{channel.handle}</p>
              <p className="text-xs text-gray-500 text-center mt-1">{channel.videos} videos</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Videos */}
      <div>
        <h2 className="text-lg font-bold mb-4">Latest Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}