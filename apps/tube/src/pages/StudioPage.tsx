import React, { useState } from 'react';
import { Upload, Video, BarChart3, DollarSign, Settings, Plus } from 'lucide-react';
import { VideoUploadModal } from '../components/upload/VideoUploadModal';
import { VideoEditor } from '../components/upload/VideoEditor';
import { MonetizationSettings } from '../components/upload/MonetizationSettings';
import { AnalyticsDashboard } from '../components/upload/AnalyticsDashboard';

type StudioTab = 'dashboard' | 'uploads' | 'editor' | 'monetization' | 'settings';

export function StudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Mock stats
  const stats = {
    totalViews: 125543,
    totalRevenue: 1234.56,
    subscribers: 12543,
    videos: 24,
    watchTime: 4321, // in hours
  };

  const tabs = [
    { id: 'dashboard' as StudioTab, icon: BarChart3, label: 'Dashboard' },
    { id: 'uploads' as StudioTab, icon: Video, label: 'Content' },
    { id: 'editor' as StudioTab, icon: Settings, label: 'Editor' },
    { id: 'monetization' as StudioTab, icon: DollarSign, label: 'Monetization' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1f1f1f] p-4 flex-shrink-0">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Creator Studio
        </h1>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-[#272727] text-tube-500' : 'hover:bg-[#272727]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 w-full bg-tube-500 hover:bg-tube-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </button>
        </div>

        {/* Channel Info */}
        <div className="mt-8 p-4 bg-[#272727] rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div>
              <p className="font-medium">Your Channel</p>
              <p className="text-sm text-gray-400">@username.skippster.social</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <p>{stats.subscribers.toLocaleString()} subscribers</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && <AnalyticsDashboard stats={stats} />}
        {activeTab === 'uploads' && <ContentLibrary onSelectVideo={setSelectedVideo} />}
        {activeTab === 'editor' && selectedVideo ? (
          <VideoEditor videoId={selectedVideo} onBack={() => setSelectedVideo(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Settings className="w-16 h-16 mb-4" />
            <p>Select a video to edit</p>
          </div>
        )}
        {activeTab === 'monetization' && <MonetizationSettings />}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <VideoUploadModal
          onClose={() => setShowUploadModal(false)}
          onComplete={(videoId) => {
            setShowUploadModal(false);
            setSelectedVideo(videoId);
            setActiveTab('editor');
          }}
        />
      )}
    </div>
  );
}

function ContentLibrary({ onSelectVideo }: { onSelectVideo: (id: string) => void }) {
  const videos = [
    {
      id: '1',
      title: 'Welcome to Skippster Tube',
      status: 'published',
      views: 12500,
      revenue: 45.67,
      uploadedAt: '2024-03-01',
    },
    {
      id: '2',
      title: 'Web3 Development Tutorial',
      status: 'published',
      views: 8900,
      revenue: 32.45,
      uploadedAt: '2024-02-28',
    },
    {
      id: '3',
      title: 'Building P2P Apps',
      status: 'processing',
      views: 0,
      revenue: 0,
      uploadedAt: '2024-03-02',
    },
    {
      id: '4',
      title: 'TypeScript Best Practices',
      status: 'draft',
      views: 0,
      revenue: 0,
      uploadedAt: '2024-03-02',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Content Library</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg transition-colors">
            Upload
          </button>
          <button className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Videos" value={videos.length} icon={Video} />
        <StatCard label="Total Views" value="21400" icon={BarChart3} />
        <StatCard label="Total Revenue" value="$78.12" icon={DollarSign} />
        <StatCard label="Processing" value="1" icon={Upload} />
      </div>

      {/* Videos Table */}
      <div className="bg-[#1f1f1f] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#272727]">
            <tr>
              <th className="text-left p-4">Video</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Views</th>
              <th className="text-right p-4">Revenue</th>
              <th className="text-right p-4">Date</th>
              <th className="text-right p-4"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr
                key={video.id}
                onClick={() => onSelectVideo(video.id)}
                className="border-t border-gray-800 hover:bg-[#272727] cursor-pointer"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="aspect-video w-40 bg-gray-800 rounded" />
                    <div>
                      <p className="font-medium line-clamp-1">{video.title}</p>
                      <p className="text-sm text-gray-500">10:30</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      video.status === 'published'
                        ? 'bg-green-500/20 text-green-500'
                        : video.status === 'processing'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {video.status}
                  </span>
                </td>
                <td className="p-4 text-right">{video.views.toLocaleString()}</td>
                <td className="p-4 text-right">${video.revenue.toFixed(2)}</td>
                <td className="p-4 text-right text-sm text-gray-500">{video.uploadedAt}</td>
                <td className="p-4 text-right">
                  <button className="p-2 hover:bg-[#3d3d3d] rounded-full">
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-[#1f1f1f] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

import { Video } from 'lucide-react';
import { BarChart3, Upload } from 'lucide-react';