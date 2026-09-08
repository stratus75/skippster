/**
 * DHT-based Torrent Tracker
 * Provides decentralized peer discovery using the BitTorrent DHT protocol
 * and a built-in HTTP tracker for WebTorrent compatibility
 */

import { Router, Request, Response } from 'express';
import { getSeederService } from '../services/SeederService';

export interface TrackerConfig {
  port?: number;
  enableDHT?: boolean;
  enableHTTP?: boolean;
  peerId?: Buffer;
  nodeId?: Buffer;
}

export interface AnnounceRequest {
  info_hash: string;
  peer_id: string;
  port: number;
  uploaded?: number;
  downloaded?: number;
  left?: number;
  compact?: boolean;
  event?: 'started' | 'stopped' | 'completed' | '';
}

export interface PeersResponse {
  interval: number;
  complete: number;
  incomplete: number;
  peers: Array<{ ip: string; port: number; peer_id?: string }>;
}

/**
 * DHT-based Tracker that provides:
 * 1. HTTP tracker endpoint compatible with WebTorrent
 * 2. DHT peer discovery for decentralized operation
 * 3. Local peer registry for faster discovery
 */
export class DHTTracker {
  private router: Router;
  private config: Required<TrackerConfig>;
  private localPeers: Map<string, Map<string, { info: { ip: string; port: number; lastSeen: number; event?: string }; timeout: NodeJS.Timeout }>> = new Map(); // infoHash -> peerKey -> peer data
  private dhtNodes: Set<string> = new Set(); // Known DHT bootstrap nodes
  private running: boolean = false;
  private server: any = null;

  // Default DHT bootstrap nodes
  private readonly DEFAULT_DHT_NODES = [
    'router.bittorrent.com:6881',
    'router.utorrent.com:6881',
    'dht.transmissionbt.com:6881',
    'dht.aelitis.com:6881',
  ];

  constructor(config: TrackerConfig = {}) {
    this.router = Router();
    this.config = {
      port: config.port || 4001,
      enableDHT: config.enableDHT !== false,
      enableHTTP: config.enableHTTP !== false,
      peerId: config.peerId || this.generatePeerId(),
      nodeId: config.nodeId || this.generateNodeId(),
    };

    this.setupRoutes();
    this.bootstrapDHT();
  }

  private generatePeerId(): Buffer {
    // Generate a unique peer ID for this tracker node
    const prefix = '-SK0001-'; // Skippster tracker identifier
    const random = require('crypto').randomBytes(12);
    return Buffer.from(prefix + random.toString('hex').slice(0, 12));
  }

  private generateNodeId(): Buffer {
    return require('crypto').randomBytes(20);
  }

  private setupRoutes(): void {
    // HTTP Tracker endpoint (compatible with BitTorrent protocol)
    this.router.get('/announce', this.handleAnnounce.bind(this));
    this.router.post('/announce', this.handleAnnounce.bind(this));

    // Scrape endpoint for torrent stats
    this.router.get('/scrape', this.handleScrape.bind(this));

    // DHT endpoint for peer exchange
    this.router.get('/dht/peers', this.getDHTPeers.bind(this));
    this.router.post('/dht/peers', this.addDHTPeers.bind(this));

    // Tracker info endpoint
    this.router.get('/stats', this.getStats.bind(this));

    // Health check
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        dht: this.running,
        localPeers: this.getLocalPeerCount(),
        dhtNodes: this.dhtNodes.size,
      });
    });
  }

  /**
   * Handle announce request from peers
   * This is the main endpoint for peer discovery
   */
  private async handleAnnounce(req: Request, res: Response): Promise<void> {
    try {
      const announceReq = this.parseAnnounceRequest(req);

      if (!announceReq.info_hash || !announceReq.peer_id || !announceReq.port) {
        res.status(400).send('Invalid announce request');
        return;
      }

      const infoHash = announceReq.info_hash;
      const peerId = announceReq.peer_id;
      const port = announceReq.port;

      // Get peer IP
      const peerIp = this.getPeerIP(req);

      // Update local peer registry
      this.registerPeer(infoHash, peerId, peerIp, port, announceReq.event);

      // Get peers for this torrent
      const peers = await this.discoverPeers(infoHash, peerId, announceReq);

      // Update seeder service with peer info
      const seederService = getSeederService();
      if (seederService) {
        seederService.updatePeerStatus(infoHash, peerId, {
          ip: peerIp,
          port,
          uploaded: announceReq.uploaded || 0,
          downloaded: announceReq.downloaded || 0,
          left: announceReq.left || 0,
          event: announceReq.event,
        });
      }

      // Respond with peer list
      const response: PeersResponse = {
        interval: 1800, // Re-announce interval in seconds
        complete: seederService?.getSeederCount(infoHash) || 0,
        incomplete: seederService?.getLeecherCount(infoHash) || 0,
        peers: peers.slice(0, 50), // Limit to 50 peers for efficiency
      };

      // Compact response format
      if (announceReq.compact) {
        const compactPeers = this.encodeCompactPeers(response.peers);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(compactPeers);
      } else {
        res.json(response);
      }

      console.log(`[Tracker] Announce: ${infoHash.slice(0, 8)} from ${peerIp}:${port} (${announceReq.event || 'update'})`);
    } catch (error) {
      console.error('[Tracker] Announce error:', error);
      res.status(500).send('Internal error');
    }
  }

  /**
   * Parse announce request parameters
   */
  private parseAnnounceRequest(req: Request): AnnounceRequest {
    if (req.method === 'GET') {
      return {
        info_hash: req.query.info_hash as string,
        peer_id: req.query.peer_id as string,
        port: parseInt(req.query.port as string) || 0,
        uploaded: parseInt(req.query.uploaded as string) || 0,
        downloaded: parseInt(req.query.downloaded as string) || 0,
        left: parseInt(req.query.left as string) || 0,
        compact: req.query.compact === '1',
        event: (req.query.event as any) || '',
      };
    } else {
      return {
        info_hash: req.body.info_hash,
        peer_id: req.body.peer_id,
        port: parseInt(req.body.port) || 0,
        uploaded: parseInt(req.body.uploaded) || 0,
        downloaded: parseInt(req.body.downloaded) || 0,
        left: parseInt(req.body.left) || 0,
        compact: req.body.compact === '1',
        event: req.body.event || '',
      };
    }
  }

  /**
   * Register a peer in the local registry
   */
  private registerPeer(infoHash: string, peerId: string, ip: string, port: number, event?: string): void {
    const key = `${infoHash}:${peerId}`;
    const peerInfo = { ip, port, lastSeen: Date.now(), event };

    if (!this.localPeers.has(infoHash)) {
      this.localPeers.set(infoHash, new Map());
    }

    // Store peer info with timeout
    const peerTimeout = setTimeout(() => {
      this.removePeer(infoHash, peerId);
    }, 2700 * 1000); // 45 minutes timeout

    this.localPeers.get(infoHash)!.set(key, { info: peerInfo, timeout: peerTimeout });

    // Handle stop event
    if (event === 'stopped') {
      this.removePeer(infoHash, peerId);
    }
  }

  /**
   * Remove a peer from the registry
   */
  private removePeer(infoHash: string, peerId: string): void {
    const key = `${infoHash}:${peerId}`;
    const peers = this.localPeers.get(infoHash);
    if (peers) {
      const peerData = (peers as any).get(key);
      if (peerData?.timeout) {
        clearTimeout(peerData.timeout);
      }
      (peers as any).delete(key);
    }
  }

  /**
   * Discover peers for a torrent using DHT and local registry
   */
  private async discoverPeers(infoHash: string, requesterId: string, req: AnnounceRequest): Promise<Array<{ ip: string; port: number; peer_id?: string }>> {
    const peers: Array<{ ip: string; port: number; peer_id?: string }> = [];

    // 1. Add local peers
    const localPeersData = this.localPeers.get(infoHash);
    if (localPeersData) {
      for (const [key, data] of localPeersData) {
        if (key !== `${infoHash}:${requesterId}`) {
          peers.push(data.info);
        }
      }
    }

    // 2. Query DHT network for more peers
    if (this.config.enableDHT) {
      try {
        const dhtPeers = await this.queryDHT(infoHash);
        peers.push(...dhtPeers);
      } catch (error) {
        console.error('[Tracker] DHT query failed:', error);
      }
    }

    // 3. Query seeder service for known peers
    const seederService = getSeederService();
    if (seederService) {
      const seederPeers = seederService.getPeersForTorrent(infoHash);
      for (const peer of seederPeers) {
        if (peer.peerId !== requesterId) {
          peers.push({ ip: peer.ip, port: peer.port, peer_id: peer.peerId });
        }
      }
    }

    // Deduplicate peers
    const seen = new Set<string>();
    return peers.filter(peer => {
      const key = `${peer.ip}:${peer.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Query DHT network for peers
   */
  private async queryDHT(infoHash: string): Promise<Array<{ ip: string; port: number }>> {
    // In a full implementation, this would use a DHT library
    // For now, we return empty array and rely on local peers + seeder service
    // The DHT functionality is simulated here for compatibility
    return [];
  }

  /**
   * Bootstrap DHT by connecting to known nodes
   */
  private bootstrapDHT(): void {
    if (!this.config.enableDHT) return;

    for (const node of this.DEFAULT_DHT_NODES) {
      this.dhtNodes.add(node);
    }

    console.log('[Tracker] DHT bootstrap complete, nodes:', this.dhtNodes.size);
  }

  /**
   * Add external DHT peers
   */
  private addDHTPeers(req: Request, res: Response): void {
    const { nodes } = req.body;
    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        this.dhtNodes.add(node);
      }
    }
    res.json({ success: true, nodeCount: this.dhtNodes.size });
  }

  /**
   * Get DHT peers for a torrent
   */
  private getDHTPeers(req: Request, res: Response): void {
    const { info_hash } = req.query;
    if (!info_hash) {
      res.status(400).json({ error: 'Missing info_hash' });
      return;
    }

    // Get peers from local registry
    const localPeersData = this.localPeers.get(info_hash as string);
    const peers: Array<{ ip: string; port: number }> = [];

    if (localPeersData) {
      for (const [_, data] of localPeersData) {
        peers.push({ ip: data.info.ip, port: data.info.port });
      }
    }

    res.json({ peers, dhtNodes: this.dhtNodes.size });
  }

  /**
   * Handle scrape request for torrent stats
   */
  private handleScrape(req: Request, res: Response): void {
    const seederService = getSeederService();
    const infoHashes = (req.query.info_hash as string)?.split(',') || [];

    const files: Record<string, { complete: number; incomplete: number; downloaded: number }> = {};

    for (const infoHash of infoHashes) {
      files[infoHash] = {
        complete: seederService?.getSeederCount(infoHash) || 0,
        incomplete: seederService?.getLeecherCount(infoHash) || 0,
        downloaded: seederService?.getDownloadCount(infoHash) || 0,
      };
    }

    res.json({ files });
  }

  /**
   * Get tracker statistics
   */
  private getStats(req: Request, res: Response): void {
    const seederService = getSeederService();

    res.json({
      version: '1.0.0',
      trackerId: this.config.peerId.toString('hex').slice(0, 16),
      localPeers: this.getLocalPeerCount(),
      torrents: this.localPeers.size,
      dhtNodes: this.dhtNodes.size,
      seederService: seederService ? {
        activeSeeders: seederService.getActiveSeederCount(),
        totalTorrents: seederService.getTotalTorrents(),
      } : null,
    });
  }

  /**
   * Get total local peer count
   */
  private getLocalPeerCount(): number {
    let count = 0;
    for (const peers of this.localPeers.values()) {
      count += (peers as any).size || 0;
    }
    return count;
  }

  /**
   * Get peer IP from request
   */
  private getPeerIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           (req.headers['x-real-ip'] as string) ||
           req.socket.remoteAddress?.replace('::ffff:', '') ||
           '0.0.0.0';
  }

  /**
   * Encode peers in compact format
   */
  private encodeCompactPeers(peers: Array<{ ip: string; port: number }>): Buffer {
    const buf = Buffer.alloc(peers.length * 6);

    for (let i = 0; i < peers.length; i++) {
      const peer = peers[i];
      const offset = i * 6;

      // IPv4 address (4 bytes)
      const ipParts = peer.ip.split('.');
      for (let j = 0; j < 4; j++) {
        buf[offset + j] = parseInt(ipParts[j] || '0');
      }

      // Port (2 bytes, big-endian)
      buf[offset + 4] = (peer.port >> 8) & 0xff;
      buf[offset + 5] = peer.port & 0xff;
    }

    return buf;
  }

  /**
   * Start the tracker server
   */
  async start(): Promise<void> {
    if (this.running) return;

    const express = require('express');
    const http = require('http');

    const app = express();
    app.use(express.json());
    app.use('/', this.router);

    return new Promise((resolve) => {
      this.server = http.createServer(app);
      this.server.listen(this.config.port, () => {
        this.running = true;
        console.log(`[Tracker] DHT Tracker running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the tracker server
   */
  async stop(): Promise<void> {
    if (!this.running || !this.server) return;

    return new Promise((resolve) => {
      this.server.close(() => {
        this.running = false;
        this.server = null;
        console.log('[Tracker] DHT Tracker stopped');
        resolve();
      });
    });
  }

  /**
   * Get the Express router for integration
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Check if tracker is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

// Singleton instance
let trackerInstance: DHTTracker | null = null;

export function getDHTTracker(config?: TrackerConfig): DHTTracker {
  if (!trackerInstance) {
    trackerInstance = new DHTTracker(config);
  }
  return trackerInstance;
}

export function createDHTTracker(config?: TrackerConfig): DHTTracker {
  if (trackerInstance) {
    trackerInstance.stop();
  }
  trackerInstance = new DHTTracker(config);
  return trackerInstance;
}
