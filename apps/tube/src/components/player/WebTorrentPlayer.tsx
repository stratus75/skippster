/**
 * WebTorrentPlayer - React component for P2P video streaming
 */

import React, { useEffect, useRef, useState } from 'react';
import WebTorrent from 'webtorrent';

export interface TorrentInfo {
  infoHash: string;
  magnetURI: string;
  name: string;
  length: number;
  files: TorrentFile[];
}

export interface TorrentFile {
  name: string;
  length: number;
  path: string;
}

export interface PlayerProgress {
  downloaded: number;
  total: number;
  speed: number;
  progress: number;
  peers: number;
}

export interface StreamOptions {
  index?: number;
  start?: number;
  end?: number;
}

interface WebTorrentPlayerProps {
  magnetURI?: string;
  infoHash?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  fileIndex?: number;
  onReady?: (info: TorrentInfo) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: PlayerProgress) => void;
  onPeers?: (peers: number) => void;
  className?: string;
}

// Singleton client instance
let clientInstance: WebTorrent.Instance | null = null;

function getTorrentClient(): WebTorrent.Instance {
  if (!clientInstance) {
    clientInstance = new WebTorrent({
      tracker: {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.fastcast.nz',
        ],
      },
    });
  }
  return clientInstance;
}

export const WebTorrentPlayer: React.FC<WebTorrentPlayerProps> = ({
  magnetURI,
  infoHash,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  poster,
  fileIndex = 0,
  onReady,
  onError,
  onProgress,
  onPeers,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uri = magnetURI || (infoHash ? `magnet:?xt=urn:btih:${infoHash}` : null);
    if (!uri || !videoRef.current) return;

    const videoElement = videoRef.current;
    const client = getTorrentClient();

    setError(null);
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let currentTorrent: WebTorrent.Torrent | null = null;

    const startStreaming = async () => {
      try {
        client.add(uri, (torrent) => {
          currentTorrent = torrent;
          const file = torrent.files[fileIndex];

          if (!file) {
            const err = new Error(`File index ${fileIndex} not found`);
            setError(err);
            onError?.(err);
            return;
          }

          file.appendTo(videoElement, (err) => {
            if (err) {
              setError(err);
              onError?.(err);
            } else {
              onReady?.({
                infoHash: torrent.infoHash,
                magnetURI: torrent.magnetURI,
                name: torrent.name,
                length: torrent.length,
                files: torrent.files.map((f) => ({
                  name: f.name,
                  length: f.length,
                  path: f.path,
                })),
              });
            }
          });

          progressInterval = setInterval(() => {
            onProgress?.({
              downloaded: torrent.downloaded,
              total: torrent.length,
              progress: torrent.progress,
              speed: torrent.downloadSpeed,
              peers: torrent.numPeers,
            });
            onPeers?.(torrent.numPeers);
          }, 1000);
        });
      } catch (err) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        onError?.(errObj);
      }
    };

    startStreaming();

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (currentTorrent) {
        client.remove(currentTorrent.infoHash);
      }
    };
  }, [magnetURI, infoHash, fileIndex, onReady, onError, onProgress, onPeers]);

  return (
    <div className={`webtorrent-player relative w-full h-full ${className}`}>
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={muted}
        poster={poster}
        className="w-full h-full object-contain"
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  );
};

export default WebTorrentPlayer;