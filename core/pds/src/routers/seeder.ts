/**
 * Seeder Router - HTTP API for managing P2P seeders
 * Provides endpoints for seeder management, peer tracking, and torrent operations
 */

import { Router, Request, Response } from 'express';
import { createSeederService, getSeederService, SeederService, SeederTorrent } from '../services/SeederService';
import { authMiddleware } from '../api/middleware';

export interface SeederRouterConfig {
  uploadDir?: string;
  port?: number;
  maxTorrents?: number;
  enableDHT?: boolean;
}

export function createSeederRouter(config?: SeederRouterConfig): Router {
  const router = Router();
  let seederService: SeederService | null = null;

  // Initialize seeder service
  function getSeeder(): SeederService {
    if (!seederService) {
      seederService = createSeederService(config);
    }
    return seederService;
  }

  /**
   * Health check - GET /api/seeder/health
   */
  router.get('/health', (req: Request, res: Response) => {
    const seeder = getSeeder();
    res.json({
      status: seeder.isRunning() ? 'ok' : 'stopped',
      activeTorrents: seeder.getActiveSeederCount(),
      totalTorrents: seeder.getTotalTorrents(),
    });
  });

  /**
   * Start seeder service - POST /api/seeder/start
   */
  router.post('/start', async (req: Request, res: Response) => {
    try {
      const seeder = getSeeder();
      await seeder.start();
      res.json({ success: true, message: 'Seeder service started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Stop seeder service - POST /api/seeder/stop
   */
  router.post('/stop', async (req: Request, res: Response) => {
    try {
      const seeder = getSeeder();
      await seeder.stop();
      res.json({ success: true, message: 'Seeder service stopped' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get all active torrents - GET /api/seeder/torrents
   */
  router.get('/torrents', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const torrents = seeder.getActiveTorrents();
    res.json({ torrents, count: torrents.length });
  });

  /**
   * Get a specific torrent - GET /api/seeder/torrents/:infoHash
   */
  router.get('/torrents/:infoHash', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const torrent = seeder.getTorrent(req.params.infoHash);

    if (!torrent) {
      res.status(404).json({ error: 'Torrent not found' });
      return;
    }

    res.json(torrent);
  });

  /**
   * Start seeding a file - POST /api/seeder/seed
   * Body: { filePath: string, name?: string }
   */
  router.post('/seed', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { filePath, name } = req.body;

      if (!filePath) {
        res.status(400).json({ error: 'filePath is required' });
        return;
      }

      const seeder = getSeeder();
      const torrent = await seeder.seedFile(filePath, name);

      res.status(201).json({
        success: true,
        torrent: {
          infoHash: torrent.infoHash,
          name: torrent.name,
          magnetURI: torrent.magnetURI,
          size: torrent.size,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Stop seeding a torrent - DELETE /api/seeder/torrents/:infoHash
   */
  router.delete('/torrents/:infoHash', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { infoHash } = req.params;
      const { destroy } = req.query;

      const seeder = getSeeder();
      const success = await seeder.stopSeeding(infoHash, destroy === 'true');

      if (!success) {
        res.status(404).json({ error: 'Torrent not found or already stopped' });
        return;
      }

      res.json({ success: true, message: 'Seeding stopped' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get peers for a torrent - GET /api/seeder/peers/:infoHash
   */
  router.get('/peers/:infoHash', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const peers = seeder.getPeersForTorrent(req.params.infoHash);

    res.json({
      infoHash: req.params.infoHash,
      peers,
      count: peers.length,
    });
  });

  /**
   * Get seeder statistics - GET /api/seeder/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const stats = seeder.getStats();

    res.json(stats);
  });

  /**
   * Get seeding progress for a torrent - GET /api/seeder/progress/:infoHash
   */
  router.get('/progress/:infoHash', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const torrent = seeder.getTorrent(req.params.infoHash);

    if (!torrent) {
      res.status(404).json({ error: 'Torrent not found' });
      return;
    }

    res.json({
      infoHash: torrent.infoHash,
      name: torrent.name,
      size: torrent.size,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      seeders: torrent.seeders,
      leechers: torrent.leechers,
      progress: torrent.size > 0 ? torrent.downloaded / torrent.size : 0,
    });
  });

  /**
   * Create a magnet URI for a torrent - GET /api/seeder/magnet/:infoHash
   */
  router.get('/magnet/:infoHash', (req: Request, res: Response) => {
    const seeder = getSeeder();
    const { infoHash } = req.params;
    const { name } = req.query;

    const magnetURI = seeder.createMagnetURI(infoHash, name as string);

    res.json({
      infoHash,
      name: name || 'Unknown',
      magnetURI,
    });
  });

  /**
   * Register a peer with the seeder service - POST /api/seeder/register-peer
   * Used by tracker to register peer information
   */
  router.post('/register-peer', (req: Request, res: Response) => {
    const { infoHash, peerId, ip, port, uploaded, downloaded, left, event } = req.body;

    if (!infoHash || !peerId) {
      res.status(400).json({ error: 'infoHash and peerId are required' });
      return;
    }

    const seeder = getSeeder();
    seeder.updatePeerStatus(infoHash, peerId, {
      ip,
      port,
      uploaded,
      downloaded,
      left,
      event,
    });

    res.json({ success: true });
  });

  /**
   * Batch register peers (for DHT sync) - POST /api/seeder/batch-register
   */
  router.post('/batch-register', (req: Request, res: Response) => {
    const { peers } = req.body;

    if (!Array.isArray(peers)) {
      res.status(400).json({ error: 'peers array is required' });
      return;
    }

    const seeder = getSeeder();
    let registered = 0;

    for (const peer of peers) {
      if (peer.infoHash && peer.peerId) {
        seeder.updatePeerStatus(peer.infoHash, peer.peerId, peer);
        registered++;
      }
    }

    res.json({ success: true, registered });
  });

  return router;
}

export default createSeederRouter;
