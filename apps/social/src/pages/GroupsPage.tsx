import React from 'react';
import { Users, Plus, Lock, Globe } from 'lucide-react';

export function GroupsPage() {
  const [activeTab, setActiveTab] = React.useState<'joined' | 'discover' | 'requests'>('joined');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button className="bg-social-500 hover:bg-social-600 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3e4042] mb-6">
        <button
          onClick={() => setActiveTab('joined')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'joined'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Your Groups
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'discover'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Requests
          <span className="ml-2 bg-social-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
        </button>
      </div>

      {/* Content based on tab */}
      {activeTab === 'joined' && <JoinedGroups />}
      {activeTab === 'discover' && <DiscoverGroups />}
      {activeTab === 'requests' && <GroupRequests />}
    </div>
  );
}

function JoinedGroups() {
  const groups = [
    { id: '1', name: 'Web3 Developers', privacy: 'public', members: 12500, newPosts: 3 },
    { id: '2', name: 'Skippster Tube Creators', privacy: 'public', members: 8700, newPosts: 5 },
    { id: '3', name: 'Tech News & Discussion', privacy: 'public', members: 45000, newPosts: 12 },
    { id: '4', name: 'Private Study Group', privacy: 'private', members: 15, newPosts: 0 },
  ];

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id} className="bg-[#242526] rounded-lg p-4 hover:bg-[#3a3b3c] transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#3a3b3c] rounded-lg flex-shrink-0 flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{group.name}</h3>
                {group.privacy === 'private' ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-500">{group.members.toLocaleString()} members</p>
              {group.newPosts > 0 && (
                <p className="text-sm text-social-500 mt-1">{group.newPosts} new posts</p>
              )}
            </div>
            <button className="p-2 hover:bg-[#3a3b3c] rounded-full">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoverGroups() {
  const groups = [
    { id: '1', name: 'React Developers', members: 56000, privacy: 'public' },
    { id: '2', name: 'TypeScript Enthusiasts', members: 34000, privacy: 'public' },
    { id: '3', name: 'Crypto Traders', members: 89000, privacy: 'public' },
    { id: '4', name: 'UI/UX Designers', members: 42000, privacy: 'public' },
    { id: '5', name: 'Freelance Developers', members: 28000, privacy: 'public' },
    { id: '6', name: 'Startup Founders', members: 19000, privacy: 'public' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group) => (
        <div key={group.id} className="bg-[#242526] rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#3a3b3c] rounded-lg flex-shrink-0 flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{group.name}</h3>
              <p className="text-sm text-gray-500">{group.members.toLocaleString()} members</p>
              <button className="w-full mt-3 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors">
                Join Group
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupRequests() {
  const requests = [
    { id: '1', name: 'Advanced TypeScript', members: 5600, invitedBy: 'Alice Johnson' },
    { id: '2', name: 'Web3 Startups', members: 3200, invitedBy: 'Bob Smith' },
  ];

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-[#242526] rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#3a3b3c] rounded-lg flex-shrink-0 flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{request.name}</h3>
              <p className="text-sm text-gray-500">{request.members.toLocaleString()} members</p>
              <p className="text-sm text-gray-400 mt-1">Invited by {request.invitedBy}</p>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors">
                  Accept
                </button>
                <button className="flex-1 bg-[#3a3b3c] hover:bg-[#4e4f50] py-2 rounded font-medium transition-colors">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}