/**
 * WebTorrent integration for P2P video streaming
 */

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

export interface StreamOptions {
  index?: number; // File index to stream (default: 0)
  start?: number; // Start position in bytes
  end?: number; // End position in bytes
}

/**
 * WebTorrent client wrapper
 */
export class TorrentClient {
  private client: WebTorrent.Instance;
  private activeTorrents: Map<string, WebTorrent.Torrent> = new Map();

  constructor() {
    this.client = new WebTorrent({
      tracker: {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.fastcast.nz',
        ],
      },
    });
  }

  /**
   * Add a torrent by magnet URI
   */
  async addTorrent(magnetURI: string): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      this.client.add(magnetURI, (torrent) => {
        this.activeTorrents.set(torrent.infoHash, torrent);

        const info: TorrentInfo = {
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          name: torrent.name,
          length: torrent.length,
          files: torrent.files.map((f) => ({
            name: f.name,
            length: f.length,
            path: f.path,
          })),
        };

        resolve(info);
      });
    });
  }

  /**
   * Stream a torrent file to a media element
   */
  async streamToElement(
    magnetURI: string,
    videoElement: HTMLVideoElement,
    options: StreamOptions = {}
  ): Promise<WebTorrent.Torrent> {
    return new Promise((resolve, reject) => {
      this.client.add(magnetURI, (torrent) => {
        const fileIndex = options.index || 0;
        const file = torrent.files[fileIndex];

        if (!file) {
          reject(new Error(`File index ${fileIndex} not found`));
          return;
        }

        file.appendTo(videoElement, (err) => {
          if (err) {
            reject(err);
          } else {
            this.activeTorrents.set(torrent.infoHash, torrent);
            resolve(torrent);
          }
        });
      });
    });
  }

  /**
   * Get a readable stream from a torrent file
   */
  async getStream(
    magnetURI: string,
    options: StreamOptions = {}
  ): Promise<ReadableStream> {
    return new Promise((resolve, reject) => {
      this.client.add(magnetURI, (torrent) => {
        const fileIndex = options.index || 0;
        const file = torrent.files[fileIndex];

        if (!file) {
          reject(new Error(`File index ${fileIndex} not found`));
          return;
        }

        const stream = file.createReadStream(options);
        resolve(stream);
      });
    });
  }

  /**
   * Seed a file or directory
   */
  async seed(input: string | File | FileList | Buffer): Promise<TorrentInfo> {
    return new Promise((resolve, reject) => {
      this.client.seed(input, (torrent) => {
        this.activeTorrents.set(torrent.infoHash, torrent);

        const info: TorrentInfo = {
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          name: torrent.name,
          length: torrent.length,
          files: torrent.files.map((f) => ({
            name: f.name,
            length: f.length,
            path: f.path,
          })),
        };

        resolve(info);
      });
    });
  }

  /**
   * Remove a torrent
   */
  removeTorrent(infoHash: string, destroy = false): void {
    const torrent = this.activeTorrents.get(infoHash);
    if (torrent) {
      torrent.destroy({ destroy });
      this.activeTorrents.delete(infoHash);
    }
  }

  /**
   * Get torrent progress
   */
  getProgress(infoHash: string): { progress: number; speed: number; peers: number } {
    const torrent = this.activeTorrents.get(infoHash);
    if (!torrent) {
      return { progress: 0, speed: 0, peers: 0 };
    }

    return {
      progress: torrent.progress,
      speed: torrent.downloadSpeed,
      peers: torrent.numPeers,
    };
  }

  /**
   * Get all active torrents
   */
  getActiveTorrents(): TorrentInfo[] {
    return Array.from(this.activeTorrents.values()).map((torrent) => ({
      infoHash: torrent.infoHash,
      magnetURI: torrent.magnetURI,
      name: torrent.name,
      length: torrent.length,
      files: torrent.files.map((f) => ({
        name: f.name,
        length: f.length,
        path: f.path,
      })),
    }));
  }

  /**
   * Destroy the client
   */
  destroy(): void {
    this.client.destroy();
    this.activeTorrents.clear();
  }
}

// Singleton instance
let clientInstance: TorrentClient | null = null;

export function getTorrentClient(): TorrentClient {
  if (!clientInstance) {
    clientInstance = new TorrentClient();
  }
  return clientInstance;
}

/**
 * Create a magnet URI from info hash
 */
export function createMagnetURI(
  infoHash: string,
  name?: string,
  trackers?: string[]
): string {
  let uri = `magnet:?xt=urn:btih:${infoHash}`;

  if (name) {
    uri += `&dn=${encodeURIComponent(name)}`;
  }

  if (trackers && trackers.length > 0) {
    trackers.forEach((t) => {
      uri += `&tr=${encodeURIComponent(t)}`;
    });
  }

  return uri;
}

/**
 * Parse magnet URI
 */
export function parseMagnetURI(uri: string): {
  infoHash: string;
  name?: string;
  trackers: string[];
} | null {
  const match = uri.match(/magnet:\?xt=urn:btih:([a-fA-F0-9]+)/);

  if (!match) {
    return null;
  }

  const infoHash = match[1];
  const nameMatch = uri.match(/&dn=([^&]+)/);
  const name = nameMatch ? decodeURIComponent(nameMatch[1]) : undefined;

  const trackerMatches = uri.matchAll(/&tr=([^&]+)/g);
  const trackers = Array.from(trackerMatches, (m) => decodeURIComponent(m[1]));

  return { infoHash, name, trackers };
}