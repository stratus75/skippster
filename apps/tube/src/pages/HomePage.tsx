import React from 'react';
import { VideoCard } from '../components/shared/VideoCard';

export function HomePage() {
  // Mock data for MVP
  const mockVideos = [
    {
      id: '1',
      did: 'did:plc:abc123',
      handle: '@alice.skippster.social',
      title: 'Welcome to Skippster Tube - Your Decentralized Video Platform',
      duration: 180,
      views: 12500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: '2',
      did: 'did:plc:def456',
      handle: '@bob.creator',
      title: 'How to Get Started with Web3 Development',
      duration: 1200,
      views: 45000,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      monetizationType: 'donations' as const,
    },
    {
      id: '3',
      did: 'did:plc:ghi789',
      handle: '@charlie.tube',
      title: 'Building P2P Applications with libp2p',
      duration: 900,
      views: 32000,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: '4',
      did: 'did:plc:jkl012',
      handle: '@diana.dev',
      title: 'React 18 Features You Need to Know',
      duration: 600,
      views: 28000,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: '5',
      did: 'did:plc:mno345',
      handle: '@evan.tech',
      title: 'TypeScript Best Practices for 2024',
      duration: 750,
      views: 41000,
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      monetizationType: 'subscription' as const,
    },
    {
      id: '6',
      did: 'did:plc:pqr678',
      handle: '@fiona.crypto',
      title: 'Understanding Lightning Network Payments',
      duration: 540,
      views: 19000,
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      monetizationType: 'free' as const,
    },
    {
      id: '7',
      did: 'did:plc:stu901',
      handle: '@george.ai',
      title: 'Building AI Agents with Skippster',
      duration: 1080,
      views: 56000,
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      monetizationType: 'payperview' as const,
    },
    {
      id: '8',
      did: 'did:plc:vwx234',
      handle: '@hannah.des',
      title: 'UI/UX Design Principles for Web Apps',
      duration: 840,
      views: 34000,
      createdAt: new Date(Date.now() - 691200000).toISOString(),
      monetizationType: 'free' as const,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2">Recommended</h1>
        <p className="text-gray-400 text-sm">Videos picked for you</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}