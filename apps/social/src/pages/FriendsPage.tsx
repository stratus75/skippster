import React from 'react';
import { UserPlus, MoreHorizontal } from 'lucide-react';

export function FriendsPage() {
  const [activeTab, setActiveTab] = React.useState<'requests' | 'suggestions' | 'all'>('requests');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      {/* Tabs */}
      <div className="flex border-b border-[#3e4042] mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Friend Requests
          <span className="ml-2 bg-social-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'suggestions'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-social-500 text-social-500'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          All Friends
        </button>
      </div>

      {/* Content based on tab */}
      {activeTab === 'requests' && <FriendRequests />}
      {activeTab === 'suggestions' && <FriendSuggestions />}
      {activeTab === 'all' && <AllFriends />}
    </div>
  );
}

function FriendRequests() {
  const requests = [
    { id: '1', name: 'Alice Johnson', handle: '@alice.j', mutualFriends: 5 },
    { id: '2', name: 'Bob Smith', handle: '@bob.s', mutualFriends: 2 },
    { id: '3', name: 'Carol Williams', handle: '@carol.w', mutualFriends: 8 },
  ];

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-[#242526] rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#3a3b3c] rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{request.name}</h3>
                  <p className="text-sm text-gray-500">{request.handle}</p>
                  <p className="text-sm text-gray-500 mt-1">{request.mutualFriends} mutual friends</p>
                </div>
                <button className="p-1 hover:bg-[#3a3b3c] rounded-full">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors">
                  Confirm
                </button>
                <button className="flex-1 bg-[#3a3b3c] hover:bg-[#4e4f50] py-2 rounded font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FriendSuggestions() {
  const suggestions = [
    { id: '1', name: 'David Lee', handle: '@david.l', mutualFriends: 12, reason: 'From Skippster Tube' },
    { id: '2', name: 'Emma Wilson', handle: '@emma.w', mutualFriends: 7, reason: 'You both follow Bob' },
    { id: '3', name: 'Frank Miller', handle: '@frank.m', mutualFriends: 4, reason: 'Suggested for you' },
    { id: '4', name: 'Grace Davis', handle: '@grace.d', mutualFriends: 9, reason: 'From Skippster Tube' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="bg-[#242526] rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#3a3b3c] rounded-full flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">{suggestion.name}</h3>
              <p className="text-sm text-gray-500">{suggestion.handle}</p>
              <p className="text-sm text-gray-400 mt-1">{suggestion.mutualFriends} mutual friends</p>
              <p className="text-xs text-social-500 mt-1">{suggestion.reason}</p>
              <button className="w-full mt-3 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Friend
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllFriends() {
  const friends = [
    { id: '1', name: 'Alice Johnson', handle: '@alice.j', avatar: '' },
    { id: '2', name: 'Bob Smith', handle: '@bob.s', avatar: '' },
    { id: '3', name: 'Carol Williams', handle: '@carol.w', avatar: '' },
    { id: '4', name: 'David Brown', handle: '@david.b', avatar: '' },
    { id: '5', name: 'Eve Davis', handle: '@eve.d', avatar: '' },
    { id: '6', name: 'Frank Miller', handle: '@frank.m', avatar: '' },
    { id: '7', name: 'Grace Wilson', handle: '@grace.w', avatar: '' },
    { id: '8', name: 'Henry Taylor', handle: '@henry.t', avatar: '' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <div key={friend.id} className="bg-[#242526] rounded-lg p-4 hover:bg-[#3a3b3c] transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3a3b3c] rounded-full flex-shrink-0" />
            <div>
              <h3 className="font-medium">{friend.name}</h3>
              <p className="text-sm text-gray-500">{friend.handle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}