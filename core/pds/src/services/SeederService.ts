/**
 * SeederService - Persistent P2P seeding service for Skippster
 * Manages long-running seeders for video content on the platform
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import WebTorrent from 'webtorrent';

export interface SeederConfig {
  uploadDir?: string;
  port?: number;
  maxTorrents?: number;
  enableDHT?: boolean;
  trackers?: string[];
}

export interface SeederTorrent {
  infoHash: string;
  name: string;
  magnetURI: string;
  filePath: string;
  size: number;
  seeders: number;
  leechers: number;
  downloaded: number;
  uploaded: number;
  startedAt: Date;
  lastSeen: Date;
}

export interface PeerInfo {
  peerId: string;
  ip: string;
  port: number;
  uploaded: number;
  downloaded: number;
  left: number;
  event?: string;
  lastSeen: Date;
}

export interface SeederStats {
  totalPeers: number;
  totalUploaded: number;
  totalDownloaded: number;
  activeTorrents: number;
}

/**
 * SeederService manages persistent seeding for video content
 * Provides:
 * - Long-running torrent seeding with WebTorrent
 * - Peer tracking and statistics
 * - Integration with DHT tracker
 * - Automatic re-seeding on startup
 */
export class SeederService extends EventEmitter {
  private client: WebTorrent.Instance | null = null;
  private torrents: Map<string, SeederTorrent> = new Map();
  private peers: Map<string, Map<string, PeerInfo>> = new Map(); // infoHash -> peerId -> PeerInfo
  private config: Required<SeederConfig>;
  private running: boolean = false;
  private uploadDir: string;

  // Default trackers for seeding
  private readonly DEFAULT_TRACKERS = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
  ];

  constructor(config: SeederConfig = {}) {
    super();
    this.config = {
      uploadDir: config.uploadDir || './uploads',
      port: config.port || 4002,
      maxTorrents: config.maxTorrents || 50,
      enableDHT: config.enableDHT !== false,
      trackers: config.trackers || this.DEFAULT_TRACKERS,
    };
    this.uploadDir = this.config.uploadDir;
  }

  /**
   * Initialize the seeder service
   */
  async initialize(): Promise<void> {
    if (this.running) return;

    // Create WebTorrent client with optimized settings for seeding
    // NOTE: torrentPort IS a real runtime option of webtorrent 2.x but is
    // missing from @types/webtorrent 0.109 — hence the cast.
    this.client = new WebTorrent({
      tracker: {
        announce: this.config.trackers,
        dht: this.config.enableDHT,
      },
      torrentPort: this.config.port,
      lsd: true, // Local Service Discovery for LAN peers
    } as WebTorrent.Options & { torrentPort: number });

    this.client.on('error', (err) => {
      console.error('[Seeder] WebTorrent error:', err);
      this.emit('error', err);
    });

    // NOTE: webtorrent 2.x does NOT emit a client-level 'peer' event
    // (peer connections are per-torrent). Peer events are wired up per
    // torrent in seedFile/seedBuffer below via torrent.on('peer').

    // Client-level 'seed' event is real at runtime (missing from typings).
    (this.client.on as NodeJS.EventEmitter['on'])('seed', (torrent: WebTorrent.Torrent) => {
      console.log(`[Seeder] Seeding: ${torrent.name} (${torrent.infoHash.slice(0, 8)})`);
      this.emit('seed', { infoHash: torrent.infoHash, name: torrent.name });
    });

    this.running = true;
    console.log('[Seeder] Service initialized');
  }

  /**
   * Start the seeder service
   */
  async start(): Promise<void> {
    await this.initialize();
    console.log('[Seeder] Service started');
  }

  /**
   * Stop the seeder service
   */
  async stop(): Promise<void> {
    if (!this.running || !this.client) return;

    // Stop all torrents gracefully
    for (const [infoHash, torrent] of this.torrents) {
      await this.stopSeeding(infoHash);
    }

    // Destroy client
    this.client.destroy();
    this.client = null;
    this.running = false;

    console.log('[Seeder] Service stopped');
  }

  /**
   * Seed a file and return torrent info
   */
  async seedFile(filePath: string, name?: string): Promise<SeederTorrent> {
    if (!this.client) {
      throw new Error('Seeder service not initialized');
    }

    return new Promise((resolve, reject) => {
      // `name` IS accepted by webtorrent 2.x seed() at runtime (verified:
      // torrent.name reflects it) but is missing from the 0.109 typings.
      this.client!.seed(filePath, {
        name: name || filePath.split('/').pop(),
        announce: this.config.trackers,
      } as WebTorrent.TorrentOptions & { name?: string }, (torrent: WebTorrent.Torrent) => {
        const seederTorrent: SeederTorrent = {
          infoHash: torrent.infoHash,
          name: torrent.name,
          magnetURI: torrent.magnetURI,
          filePath,
          size: torrent.length,
          seeders: 0,
          leechers: 0,
          downloaded: 0,
          uploaded: 0,
          startedAt: new Date(),
          lastSeen: new Date(),
        };

        this.torrents.set(torrent.infoHash, seederTorrent);
        this.peers.set(torrent.infoHash, new Map());

        // Track torrent events ('peer' is a real torrent-level event)
        (torrent.on as NodeJS.EventEmitter['on'])('peer', (_peer: unknown) => {
          this.updatePeerCount(torrent.infoHash);
        });

        torrent.on('upload', () => {
          const t = this.torrents.get(torrent.infoHash);
          if (t) {
            t.uploaded += torrent.uploaded;
            t.lastSeen = new Date();
          }
        });

        torrent.on('download', () => {
          const t = this.torrents.get(torrent.infoHash);
          if (t) {
            t.downloaded += torrent.downloaded;
            t.lastSeen = new Date();
          }
        });

        console.log(`[Seeder] Started seeding: ${seederTorrent.name} (${torrent.infoHash.slice(0, 8)})`);
        this.emit('torrent', { type: 'added', torrent: seederTorrent });

        resolve(seederTorrent);
      });
    });
  }

  /**
   * Seed a file from buffer data
   */
  async seedBuffer(buffer: Buffer, name: string): Promise<SeederTorrent> {
    if (!this.client) {
      throw new Error('Seeder service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client!.seed(buffer, {
        name,
        announce: this.config.trackers,
      } as WebTorrent.TorrentOptions & { name?: string }, (torrent: WebTorrent.Torrent) => {
        const seederTorrent: SeederTorrent = {
          infoHash: torrent.infoHash,
          name: torrent.name,
          magnetURI: torrent.magnetURI,
          filePath: '', // In-memory buffer
          size: torrent.length,
          seeders: 0,
          leechers: 0,
          downloaded: 0,
          uploaded: 0,
          startedAt: new Date(),
          lastSeen: new Date(),
        };

        this.torrents.set(torrent.infoHash, seederTorrent);
        this.peers.set(torrent.infoHash, new Map());

        resolve(seederTorrent);
      });
    });
  }

  /**
   * Stop seeding a torrent
   */
  async stopSeeding(infoHash: string, destroy: boolean = false): Promise<boolean> {
    if (!this.client) return false;

    const torrent = this.client.get(infoHash);
    if (!torrent) return false;

    const removed = this.torrents.get(infoHash);
    this.torrents.delete(infoHash);
    this.peers.delete(infoHash);

    torrent.destroy({ destroyStore: destroy });

    if (removed) {
      this.emit('torrent', { type: 'removed', infoHash });
    }

    console.log(`[Seeder] Stopped seeding: ${infoHash.slice(0, 8)}`);
    return true;
  }

  /**
   * Get a torrent by info hash
   */
  getTorrent(infoHash: string): SeederTorrent | undefined {
    return this.torrents.get(infoHash);
  }

  /**
   * Get all active torrents
   */
  getActiveTorrents(): SeederTorrent[] {
    return Array.from(this.torrents.values());
  }

  /**
   * Get peer count for a torrent
   */
  private updatePeerCount(infoHash: string): void {
    if (!this.client) return;

    const torrent = this.client.get(infoHash);
    const seederTorrent = this.torrents.get(infoHash);

    if (torrent && seederTorrent) {
      seederTorrent.leechers = torrent.numPeers;
      // webtorrent 2.x has no `seeds` property on Torrent; the wire count is
      // the de-facto seed count for our LAN seeding use case. `wires` exists
      // at runtime but is missing from the 0.109 typings.
      seederTorrent.seeders = (torrent as WebTorrent.Torrent & { wires: unknown[] }).wires.length;
      seederTorrent.lastSeen = new Date();
    }
  }

  /**
   * Update peer status
   */
  updatePeerStatus(infoHash: string, peerId: string, info: Partial<PeerInfo>): void {
    if (!this.peers.has(infoHash)) {
      this.peers.set(infoHash, new Map());
    }

    const torrentPeers = this.peers.get(infoHash)!;
    const existing = torrentPeers.get(peerId);

    torrentPeers.set(peerId, {
      peerId,
      ip: info.ip || existing?.ip || '0.0.0.0',
      port: info.port || existing?.port || 0,
      uploaded: info.uploaded || existing?.uploaded || 0,
      downloaded: info.downloaded || existing?.downloaded || 0,
      left: info.left || existing?.left || 0,
      event: info.event || existing?.event,
      lastSeen: new Date(),
    });
  }

  /**
   * Get peers for a torrent
   */
  getPeersForTorrent(infoHash: string): PeerInfo[] {
    const torrentPeers = this.peers.get(infoHash);
    if (!torrentPeers) return [];

    // Filter out stale peers (not seen in 5 minutes)
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000;

    return Array.from(torrentPeers.values()).filter(p => {
      return now - p.lastSeen.getTime() < staleThreshold;
    });
  }

  /**
   * Get seeder count for a torrent
   */
  getSeederCount(infoHash: string): number {
    const torrent = this.torrents.get(infoHash);
    return torrent?.seeders || 0;
  }

  /**
   * Get leecher count for a torrent
   */
  getLeecherCount(infoHash: string): number {
    const torrent = this.torrents.get(infoHash);
    return torrent?.leechers || 0;
  }

  /**
   * Get download count for a torrent
   */
  getDownloadCount(infoHash: string): number {
    const torrent = this.torrents.get(infoHash);
    return torrent?.downloaded || 0;
  }

  /**
   * Get total active seeder count
   */
  getActiveSeederCount(): number {
    return this.torrents.size;
  }

  /**
   * Get total torrents being seeded
   */
  getTotalTorrents(): number {
    return this.torrents.size;
  }

  /**
   * Get overall seeding statistics
   */
  getStats(): SeederStats {
    let totalPeers = 0;
    let totalUploaded = 0;
    let totalDownloaded = 0;

    for (const torrent of this.torrents.values()) {
      totalPeers += torrent.leechers;
      totalUploaded += torrent.uploaded;
      totalDownloaded += torrent.downloaded;
    }

    return {
      totalPeers,
      totalUploaded,
      totalDownloaded,
      activeTorrents: this.torrents.size,
    };
  }

  /**
   * Create a magnet URI for a torrent
   */
  createMagnetURI(infoHash: string, name?: string): string {
    let uri = `magnet:?xt=urn:btih:${infoHash}`;

    if (name) {
      uri += `&dn=${encodeURIComponent(name)}`;
    }

    for (const tracker of this.config.trackers) {
      uri += `&tr=${encodeURIComponent(tracker)}`;
    }

    return uri;
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the WebTorrent client instance
   */
  getClient(): WebTorrent.Instance | null {
    return this.client;
  }
}

// Singleton instance
let seederServiceInstance: SeederService | null = null;

export function getSeederService(): SeederService | null {
  return seederServiceInstance;
}

export function createSeederService(config?: SeederConfig): SeederService {
  if (seederServiceInstance) {
    seederServiceInstance.stop();
  }
  seederServiceInstance = new SeederService(config);
  return seederServiceInstance;
}
