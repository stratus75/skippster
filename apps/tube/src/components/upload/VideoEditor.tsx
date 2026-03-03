import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, DollarSign, Clock, ThumbsUp, TrendingUp } from 'lucide-react';

interface VideoEditorProps {
  videoId: string;
  onBack: () => void;
}

export function VideoEditor({ videoId, onBack }: VideoEditorProps) {
  const [activeSection, setActiveSection] = useState<'details' | 'monetization' | 'analytics'>('details');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Mock video data
  const video = {
    id: videoId,
    title: 'Welcome to Skippster Tube',
    description: 'A complete guide to getting started with Skippster Tube - the decentralized video platform.',
    tags: ['Skippster', 'Web3', 'Tutorial'],
    thumbnail: '',
    visibility: 'public',
    publishedAt: '2024-03-01',
  };

  const analytics = {
    views: 12543,
    uniqueViewers: 8921,
    watchTime: 4321, // minutes
    avgWatchTime: 3.4, // minutes
    likes: 456,
    dislikes: 23,
    shares: 89,
    subscribers: 123,
    revenue: 45.67,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#3d3d3d] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Edit Video</h1>
            <p className="text-sm text-gray-500">Last saved: March 2, 2024</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-social-500 hover:bg-social-600 px-4 py-2 rounded-lg font-medium transition-colors">
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Video Preview */}
      <div className="bg-[#1f1f1f] rounded-lg p-4 mb-6">
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Video Preview</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">URL: skippster.tube/watch/{videoId}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-8">
          {[
            { id: 'details', label: 'Details', icon: null },
            { id: 'monetization', label: 'Monetization', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`pb-3 border-b-2 font-medium transition-colors ${
                  activeSection === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeSection === 'details' && <DetailsSection video={video} onChange={setUnsavedChanges} />}
      {activeSection === 'monetization' && <MonetizationSection />}
      {activeSection === 'analytics' && <AnalyticsSection analytics={analytics} />}
    </div>
  );
}

function DetailsSection({
  video,
  onChange,
}: {
  video: { title: string; description: string; tags: string[] };
  onChange: (changed: boolean) => void;
}) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags);
  const [visibility, setVisibility] = useState('public');

  const handleChange = () => onChange(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleChange();
          }}
          className="w-full bg-[#272727] rounded-lg px-4 py-3"
          placeholder="Add a title that describes your video"
        />
        <p className="text-sm text-gray-500 mt-1">{title.length}/100 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleChange();
          }}
          rows={8}
          className="w-full bg-[#272727] rounded-lg px-4 py-3 resize-none"
          placeholder="Tell viewers about your video"
        />
        <p className="text-sm text-gray-500 mt-1">{description.length}/5000 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Thumbnail</label>
        <div className="aspect-video w-48 bg-[#272727] rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-600 cursor-pointer">
          <p className="text-sm text-gray-500">Upload thumbnail</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add tags (press Enter)"
          className="w-full bg-[#272727] rounded-lg px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value);
            handleChange();
          }}
          className="w-full bg-[#272727] rounded-lg px-4 py-3"
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
    </div>
  );
}

function MonetizationSection() {
  const [monetization, setMonetization] = useState<'free' | 'donations' | 'payperview' | 'subscription'>('free');
  const [lightningAddress, setLightningAddress] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium mb-4">Monetization Type</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'free', label: 'Free', desc: 'Free with optional ads' },
            { value: 'donations', label: 'Donations', desc: 'Accept Lightning tips' },
            { value: 'payperview', label: 'Pay Per View', desc: 'One-time payment' },
            { value: 'subscription', label: 'Subscription', desc: 'Monthly access' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setMonetization(option.value as any)}
              className={`p-4 rounded-lg text-left transition-colors ${
                monetization === option.value
                  ? 'bg-tube-500 text-white'
                  : 'bg-[#272727] hover:bg-[#3d3d3d]'
              }`}
            >
              <p className="font-medium mb-1">{option.label}</p>
              <p className="text-sm opacity-80">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {monetization === 'donations' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Lightning Address</label>
            <input
              type="text"
              placeholder="username@skippster.social"
              value={lightningAddress}
              onChange={(e) => setLightningAddress(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
            <p className="text-sm text-gray-500 mt-1">
              Viewers can send you instant micropayments via Lightning Network
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Solana Wallet Address</label>
            <input
              type="text"
              placeholder="Your Solana public key"
              value={solanaAddress}
              onChange={(e) => setSolanaAddress(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsSection({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Views" value={analytics.views.toLocaleString()} icon={Eye} change="+12%" />
        <MetricCard label="Watch Time" value={`${Math.floor(analytics.watchTime / 60)}h ${analytics.watchTime % 60}m`} icon={Clock} change="+8%" />
        <MetricCard label="Likes" value={analytics.likes.toLocaleString()} icon={ThumbsUp} change="+15%" />
        <MetricCard label="Revenue" value={`$${analytics.revenue.toFixed(2)}`} icon={DollarSign} change="+20%" />
      </div>

      {/* Performance Graph */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Views Over Time</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 30 }).map((_, i) => {
            const height = Math.random() * 100 + 20;
            return (
              <div
                key={i}
                className="flex-1 bg-tube-500 rounded-t transition-all hover:bg-tube-600"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Performance</h3>
        <div className="space-y-4">
          <StatRow label="Unique Viewers" value={analytics.uniqueViewers.toLocaleString()} />
          <StatRow label="Average Watch Time" value={`${analytics.avgWatchTime} minutes`} />
          <StatRow label="Subscribers Gained" value={`+${analytics.subscribers}`} />
          <StatRow label="Shares" value={analytics.shares.toLocaleString()} />
          <StatRow label="Likes to Views Ratio" value={`${((analytics.likes / analytics.views) * 100).toFixed(2)}%`} />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Revenue</h3>
        <div className="space-y-3">
          <RevenueRow label="Donations" amount="$25.00" percent={55} />
          <RevenueRow label="Pay Per View" amount="$15.50" percent={34} />
          <RevenueRow label="Subscription" amount="$5.17" percent={11} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between font-bold">
          <span>Total Revenue</span>
          <span>${analytics.revenue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  change,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  change?: string;
}) {
  return (
    <div className="bg-[#1f1f1f] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p className="text-sm text-green-500 mt-1">{change} vs last period</p>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function RevenueRow({ label, amount, percent }: { label: string; amount: string; percent: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{amount}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-social-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}