import React from 'react';
import { UserPlus, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { useFriends } from '../hooks';
import type { User, FriendRequest } from '../types';

// Mock user DID - in real app, this would come from auth
const MOCK_USER_DID = 'did:plc:test-user-001';

export function FriendsPage() {
  const [activeTab, setActiveTab] = React.useState<'requests' | 'suggestions' | 'all'>('requests');
  const { pendingRequestCount, loadPendingRequests, loadFriends } = useFriends(MOCK_USER_DID);

  // Load data on mount
  React.useEffect(() => {
    loadPendingRequests();
    loadFriends();
  }, [loadPendingRequests, loadFriends]);

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
          {pendingRequestCount > 0 && (
            <span className="ml-2 bg-social-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingRequestCount}
            </span>
          )}
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
      {activeTab === 'requests' && <FriendRequestsTab />}
      {activeTab === 'suggestions' && <FriendSuggestionsTab />}
      {activeTab === 'all' && <AllFriendsTab />}
    </div>
  );
}

function FriendRequestsTab() {
  const { pendingRequests, isLoading, error, acceptFriendRequest, declineFriendRequest } = useFriends(MOCK_USER_DID);

  const handleAccept = async (request: FriendRequest) => {
    await acceptFriendRequest(request.did1);
  };

  const handleDecline = async (request: FriendRequest) => {
    await declineFriendRequest(request.did1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-social-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-12 h-12 mx-auto text-gray-500 mb-2" />
        <p className="text-gray-500">No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div key={`${request.did1}-${request.did2}`} className="bg-[#242526] rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#3a3b3c] rounded-full flex-shrink-0 flex items-center justify-center">
              {request.requester ? (
                <span className="text-lg font-medium">
                  {request.requester.handle.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-lg">?</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {request.requester?.handle || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {request.requester?.did.slice(0, 20)}...
                  </p>
                </div>
                <button className="p-1 hover:bg-[#3a3b3c] rounded-full">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAccept(request)}
                  className="flex-1 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Confirm
                </button>
                <button
                  onClick={() => handleDecline(request)}
                  className="flex-1 bg-[#3a3b3c] hover:bg-[#4e4f50] py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UserX className="w-4 h-4" />
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

function FriendSuggestionsTab() {
  // Mock suggestions - in real app, this would come from an API
  const suggestions = [
    { id: '1', name: 'David Lee', handle: '@david.l', mutualFriends: 12, reason: 'From Skippster Tube' },
    { id: '2', name: 'Emma Wilson', handle: '@emma.w', mutualFriends: 7, reason: 'You both follow Bob' },
    { id: '3', name: 'Frank Miller', handle: '@frank.m', mutualFriends: 4, reason: 'Suggested for you' },
    { id: '4', name: 'Grace Davis', handle: '@grace.d', mutualFriends: 9, reason: 'From Skippster Tube' },
  ];

  const { sendFriendRequest } = useFriends(MOCK_USER_DID);

  const handleAddFriend = async (id: string) => {
    // In real app, we would have the DID
    // await sendFriendRequest(targetDid);
  };

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
              <button
                onClick={() => handleAddFriend(suggestion.id)}
                className="w-full mt-3 bg-social-500 hover:bg-social-600 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
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

function AllFriendsTab() {
  const { friends, friendCount, isLoading, error, removeFriendByDID } = useFriends(MOCK_USER_DID);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-social-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-12 h-12 mx-auto text-gray-500 mb-2" />
        <p className="text-gray-500">You don't have any friends yet</p>
        <p className="text-sm text-gray-400 mt-1">Add friends to see them here</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{friendCount} friends</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <div key={friend.did} className="bg-[#242526] rounded-lg p-4 hover:bg-[#3a3b3c] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-social-500/20 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-social-500 font-medium">
                  {friend.handle.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{friend.handle}</h3>
                <p className="text-sm text-gray-500 truncate">{friend.did.slice(0, 20)}...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}