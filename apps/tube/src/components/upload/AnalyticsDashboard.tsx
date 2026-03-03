import React, { useState } from 'react';
import { BarChart3, TrendingUp, Eye, Clock, DollarSign, Users, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  stats: {
    totalViews: number;
    totalRevenue: number;
    subscribers: number;
    videos: number;
    watchTime: number;
  };
}

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'revenue' | 'subscribers'>('views');

  const timeRanges = [
    { id: '7d' as const, label: '7 days' },
    { id: '30d' as const, label: '30 days' },
    { id: '90d' as const, label: '90 days' },
    { id: '365d' as const, label: '1 year' },
  ];

  // Mock data for different time ranges
  const analyticsData = {
    views: {
      current: 45678,
      previous: 38901,
      change: 17.4,
      chartData: Array.from({ length: 30 }, () => Math.random() * 100 + 50),
    },
    revenue: {
      current: 456.78,
      previous: 345.23,
      change: 32.3,
      chartData: Array.from({ length: 30 }, () => Math.random() * 50 + 20),
    },
    subscribers: {
      current: 567,
      previous: 423,
      change: 34.0,
      chartData: Array.from({ length: 30 }, () => Math.random() * 30 + 10),
    },
  };

  const currentData = analyticsData[selectedMetric];
  const isPositive = currentData.change >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Channel Analytics</h2>
          <p className="text-gray-500">Track your channel's performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="bg-[#272727] rounded-lg px-4 py-2"
          >
            <option value="views">Views</option>
            <option value="revenue">Revenue</option>
            <option value="subscribers">Subscribers</option>
          </select>
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-[#272727] rounded-lg px-4 py-2"
          >
            {timeRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          change="+12.4%"
          positive
        />
        <StatCard
          label="Watch Time"
          value={`${Math.floor(stats.watchTime)}h`}
          icon={Clock}
          change="+8.2%"
          positive
        />
        <StatCard
          label="Subscribers"
          value={stats.subscribers.toLocaleString()}
          icon={Users}
          change="+15.7%"
          positive
        />
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          change="+23.1%"
          positive
        />
      </div>

      {/* Main Chart */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">
              {selectedMetric === 'views' && 'Views'}
              {selectedMetric === 'revenue' && 'Revenue'}
              {selectedMetric === 'subscribers' && 'Subscribers'}
            </h3>
            <p className="text-sm text-gray-500">
              Last {timeRanges.find((r) => r.id === timeRange)?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {selectedMetric === 'revenue' ? '$' : ''}
              {currentData.current.toLocaleString()}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              {isPositive ? '+' : ''}{currentData.change.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 flex items-end justify-between gap-1 mt-6">
          {currentData.chartData.map((value, index) => {
            const max = Math.max(...currentData.chartData);
            const height = (value / max) * 100;
            return (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all hover:bg-tube-500 ${
                  index === currentData.chartData.length - 1 ? 'bg-tube-500' : 'bg-tube-500/60'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{timeRange === '7d' ? '7 days ago' : '30 days ago'}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <h3 className="font-bold mb-4">Top Videos</h3>
          <div className="space-y-3">
            {[
              { title: 'Welcome to Skippster Tube', views: 12543, revenue: 45.67 },
              { title: 'Web3 Development Tutorial', views: 8900, revenue: 32.45 },
              { title: 'Building P2P Applications', views: 6789, revenue: 28.90 },
              { title: 'TypeScript Best Practices', views: 5432, revenue: 21.23 },
              { title: 'React 18 Deep Dive', views: 4567, revenue: 18.76 },
            ].map((video, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">
                    {video.views.toLocaleString()} views · ${video.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <h3 className="font-bold mb-4">Audience</h3>
          <div className="space-y-4">
            {/* Age Distribution */}
            <div>
              <p className="text-sm font-medium mb-2">Age</p>
              <div className="space-y-2">
                {[
                  { label: '13-17', percent: 15 },
                  { label: '18-24', percent: 35 },
                  { label: '25-34', percent: 30 },
                  { label: '35-44', percent: 15 },
                  { label: '45+', percent: 5 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-social-500 h-2 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <p className="text-sm font-medium mb-2">Gender</p>
              <div className="flex gap-4">
                {[
                  { label: 'Male', percent: 55, color: 'bg-blue-500' },
                  { label: 'Female', percent: 40, color: 'bg-pink-500' },
                  { label: 'Other', percent: 5, color: 'bg-purple-500' },
                ].map((item) => (
                  <div key={item.label} className="flex-1">
                    <div className={`h-20 ${item.color} rounded-t relative`}>
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium">
                        {item.percent}%
                      </span>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Traffic Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TrafficSource label="Browse" views={12345} percent={35} icon={Eye} />
          <TrafficSource label="Search" views={8765} percent={25} icon={BarChart3} />
          <TrafficSource label="External" views={6543} percent={18} icon={TrendingUp} />
          <TrafficSource label="Notifications" views={4321} percent={12} icon={Bell} />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Engagement</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <EngagementMetric label="Likes" value="12456" change="+15%" />
          <EngagementMetric label="Comments" value="2345" change="+8%" />
          <EngagementMetric label="Shares" value="876" change="+22%" />
          <EngagementMetric label="CTR" value="3.2%" change="+5%" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  change,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-[#1f1f1f] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gray-500" />
        <span className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function TrafficSource({
  label,
  views,
  percent,
  icon: Icon,
}: {
  label: string;
  views: number;
  percent: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-[#272727] rounded-lg p-4 text-center">
      <Icon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
      <p className="text-lg font-bold">{views.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xs text-gray-600 mt-1">{percent}%</p>
    </div>
  );
}

function EngagementMetric({ label, value, change }: { label: string; value: string | number; change: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-green-500">{change}</p>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}