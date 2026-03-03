import React from 'react';
import { useParams } from 'react-router-dom';
import { VideoCard } from './VideoCard';

export function ChannelPage() {
  const { did } = useParams<{ did: string }>();

  // Mock channel data
  const channel = {
    did: did || 'did:plc:abc123',
    handle: '@alice.skippster.social',
    name: 'Alice Creator',
    description: 'Creating content about web3, decentralization, and the future of the internet.',
    banner: '',
    avatar: '',
    subscribers: 12500,
    joinedAt: '2023-01-15',
  };

  // Mock videos
  const videos = [
    {
      id: 'c1',
      did: channel.did,
      handle: channel.handle,
      title: 'Welcome to Skippster Tube - Your Decentralized Video Platform',
      duration: 180,
      views: 12500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 'c2',
      did: channel.did,
      handle: channel.handle,
      title: 'Understanding Decentralized Storage',
      duration: 900,
      views: 8700,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 'c3',
      did: channel.did,
      handle: channel.handle,
      title: 'Building P2P Networks with libp2p',
      duration: 1200,
      views: 15400,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      monetizationType: 'donations' as const,
    },
    {
      id: 'c4',
      did: channel.did,
      handle: channel.handle,
      title: 'Crypto Wallet Security Best Practices',
      duration: 720,
      views: 6800,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: 'c5',
      did: channel.did,
      handle: channel.handle,
      title: 'The Future of Social Media is Decentralized',
      duration: 1080,
      views: 12300,
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      monetizationType: 'free' as const,
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-tube-600 to-tube-800" />

      {/* Channel Header */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
          <div className="w-32 h-32 bg-gray-700 rounded-full border-4 border-[#0f0f0f] -mt-16 md:-mt-8" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{channel.name}</h1>
            <p className="text-gray-400">{channel.handle}</p>
            <p className="text-sm text-gray-400 mt-2">{channel.subscribers.toLocaleString()} subscribers</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
            <button className="bg-[#272727] hover:bg-[#3d3d3d] px-4 py-3 rounded-full transition-colors">
              Join
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#1f1f1f] rounded-lg p-4 mb-6">
          <p className="whitespace-pre-wrap">{channel.description}</p>
          <p className="text-sm text-gray-500 mt-2">Joined {channel.joinedAt}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-8">
            <button className="pb-3 border-b-2 border-white font-medium">Videos</button>
            <button className="pb-3 text-gray-400 hover:text-white transition-colors">Playlists</button>
            <button className="pb-3 text-gray-400 hover:text-white transition-colors">Community</button>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}