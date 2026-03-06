import React from 'react';
import { useParams } from 'react-router-dom';
import { ThumbsUp, Share, Download, MoreVertical, Loader2, AlertCircle, Users, Zap } from 'lucide-react';
import { useVideo } from '../hooks';
import { WebTorrentPlayer, PlayerProgress, TorrentInfo } from '../components/player/WebTorrentPlayer';
import { formatViews, formatTimeAgo, formatBytes } from '../utils';

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { video, isLoading, error, playerState, updatePlayerState } = useVideo(videoId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-tube-500" />
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Video</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Video not found</p>
      </div>
    );
  }

  const handlePlayerReady = (info: TorrentInfo) => {
    console.log('Torrent ready:', info);
    updatePlayerState({ isReady: true });
  };

  const handlePlayerError = (err: Error) => {
    console.error('Player error:', err);
    updatePlayerState({ error: err.message });
  };

  const handlePlayerProgress = (progress: PlayerProgress) => {
    updatePlayerState({
      progress: progress.progress,
      downloadSpeed: progress.speed,
      peers: progress.peers,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <div className="flex-1">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <WebTorrentPlayer
            magnetURI={video.magnetLink}
            controls
            className="w-full h-full"
            onReady={handlePlayerReady}
            onError={handlePlayerError}
            onProgress={handlePlayerProgress}
          />

          {/* Loading overlay */}
          {!playerState.isReady && !playerState.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-tube-500" />
                <p className="text-gray-400">Connecting to P2P network...</p>
                {playerState.peers > 0 && (
                  <p className="text-sm text-gray-500">{playerState.peers} peer(s) connected</p>
                )}
              </div>
            </div>
          )}

          {/* Error overlay */}
          {playerState.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4 text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
                  <p className="text-gray-400 text-sm">{playerState.error}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    This video may not have any active seeders. Try again later.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* P2P Stats */}
        {playerState.isReady && (
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {playerState.peers} peer{playerState.peers !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {formatBytes(playerState.downloadSpeed)}/s
            </span>
            <span>{Math.round(playerState.progress * 100)}% downloaded</span>
          </div>
        )}

        {/* Video Info */}
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div>
                  <p className="font-medium">{video.did.slice(0, 20)}...</p>
                  <p className="text-sm text-gray-400">Creator</p>
                </div>
              </div>
              <button className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <ThumbsUp className="w-5 h-5" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <Share className="w-5 h-5" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3d3d3d] px-4 py-2 rounded-full transition-colors">
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
              <button className="bg-[#272727] hover:bg-[#3d3d3d] p-2 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#272727] rounded-lg p-4 mb-4">
          <p className="font-medium mb-2">
            {formatViews(video.views)} • {formatTimeAgo(video.createdAt)}
          </p>
          <p className="whitespace-pre-wrap text-sm">{video.description || 'No description'}</p>
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {video.tags.map((tag, i) => (
                <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Monetization Info */}
        {video.monetizationType !== 'free' && (
          <div className="bg-[#272727] rounded-lg p-4 mb-4 border border-tube-500/30">
            <div className="flex items-center gap-2">
              <span className="text-tube-500 font-medium">
                {video.monetizationType === 'donations' && '💖 Accepting Donations'}
                {video.monetizationType === 'payperview' && `🔒 Pay-per-view: ${video.price} ${video.currency}`}
                {video.monetizationType === 'subscription' && '🔐 Subscription Required'}
              </span>
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <div className="text-center text-gray-400 py-8">
            <p>Comments will be available in a future update.</p>
            <p className="text-sm mt-2">P2P comments coming soon!</p>
          </div>
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <h2 className="text-lg font-bold mb-4">Related Videos</h2>
        <div className="text-center text-gray-400 py-8">
          <p>Related videos will appear here.</p>
        </div>
      </div>
    </div>
  );
}