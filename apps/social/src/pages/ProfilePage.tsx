import React from 'react';
import { User, Calendar, Lock, Globe, MoreHorizontal } from 'lucide-react';

export function ProfilePage() {
  const { did } = useParams<{ did: string }>();

  // Mock profile data
  const profile = {
    did: did || 'did:plc:abc123',
    handle: '@alice.skippster.social',
    name: 'Alice Creator',
    bio: 'Content creator, web3 enthusiast, and Skippster advocate. Building the future of decentralized media.',
    coverImage: '',
    avatar: '',
    joinedDate: 'January 2023',
    location: 'San Francisco, CA',
    friendsCount: 156,
    followersCount: 2340,
    postsCount: 89,
    isFriends: false,
    privacy: 'public',
  };

  return (
    <div>
      {/* Cover Image */}
      <div className="h-64 bg-gradient-to-r from-social-600 to-social-800" />

      {/* Profile Info */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 mb-4">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-[#3a3b3c] rounded-full border-4 border-[#18191a] flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-gray-400">{profile.handle}</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-social-500 hover:bg-social-600 px-6 py-2 rounded-lg font-medium transition-colors">
              Add Friend
            </button>
            <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] px-4 py-2 rounded-lg font-medium transition-colors">
              Message
            </button>
            <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] p-2 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <p className="whitespace-pre-wrap">{profile.bio}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <span>📍</span> {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Joined {profile.joinedDate}
            </span>
            <span className="flex items-center gap-1">
              {profile.privacy === 'public' ? (
                <>
                  <Globe className="w-4 h-4" /> Public
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Private
                </>
              )}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-6 pb-6 border-b border-[#3e4042]">
          <div className="flex items-center gap-1">
            <User className="w-5 h-5" />
            <span className="font-medium">{profile.friendsCount}</span>
            <span className="text-gray-400">friends</span>
          </div>
          <div>
            <span className="font-medium">{profile.followersCount}</span>
            <span className="text-gray-500 ml-1">followers</span>
          </div>
          <div>
            <span className="font-medium">{profile.postsCount}</span>
            <span className="text-gray-500 ml-1">posts</span>
          </div>
        </div>

        {/* Posts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 1
          </div>
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 2
          </div>
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 3
          </div>
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 4
          </div>
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 5
          </div>
          <div className="aspect-square bg-[#3a3b3c] rounded flex items-center justify-center text-gray-500">
            Photo 6
          </div>
        </div>
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';