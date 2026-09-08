/**
 * Skippster Network Service (ESM)
 * ------------------------------------------------------------------
 * The REAL decentralized transfer layer. Encapsulates:
 *   - a real bittorrent-tracker (HTTP; UDP/WS optional)
 *   - a real WebTorrent seeder client
 *
 * NETWORK MODE (env SKIPSTER_NETWORK_MODE, default "private"):
 *   "private"  -> LAN/localhost ONLY. No public DHT bootstrap, no public
 *                 trackers, LSD (Local Service Discovery) enabled so peers
 *                 on the same LAN find each other. Nothing leaves the network.
 *   "public"   -> Full DHT bootstrap + public trackers. Peers anywhere on
 *                 the internet can discover and fetch content.
 *
 * This replaces the repo's FAKE torrent layer (hand-rolled bencode/sha1
 * stubs that never actually seed or peer). Here everything is real.
 *
 * Loaded from CJS servers via dynamic import() to avoid the ESM/CJS clash
 * in this repo's bun-managed node_modules.
 */
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createRequire } from 'node:module';

const Tracker = (await import('bittorrent-tracker/server')).default;

// Resolve webtorrent from the REPO ROOT, not from core/pds. From core/pds the
// bun-hoisted copy (node_modules/.bun/webtorrent@...) is picked, which pulls in
// a broken node-datachannel native build. The root copy is the working one.
const repoRoot = join(import.meta.dirname, '..', '..');
const requireFromRoot = createRequire(join(repoRoot, 'package.json'));
const WebTorrent = (await import(requireFromRoot.resolve('webtorrent'))).default;

// Public trackers used only in "public" mode
const PUBLIC_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
];

// Public DHT bootstrap nodes (only in "public" mode)
const PUBLIC_DHT_NODES = [
  'router.bittorrent.com:6881',
  'router.utorrent.com:6881',
  'dht.transmissionbt.com:6881',
];

export class NetworkService {
  constructor(config = {}) {
    this.mode = (config.mode || process.env.SKIPSTER_NETWORK_MODE || 'private').toLowerCase();
    if (!['private', 'public'].includes(this.mode)) {
      throw new Error(`Invalid SKIPSTER_NETWORK_MODE "${this.mode}" (expected "private" or "public")`);
    }
    this.trackerPort = config.trackerPort || 4001;
    this.torrentPort = config.torrentPort || 4002;
    this.uploadDir = config.uploadDir || join(process.cwd(), 'uploads');
    // Host that peers use to reach this node's tracker. Defaults to loopback
    // (safe, same-machine only). For LAN testing set SKIPSTER_ANNOUNCE_HOST to
    // this machine's LAN IP (e.g. 192.168.0.229) so other machines can find it.
    this.announceHost = config.announceHost || process.env.SKIPSTER_ANNOUNCE_HOST || '127.0.0.1';
    this.tracker = null;
    this.client = null;
    this.torrents = new Map(); // infoHash -> { magnetURI, name, size, filePath }
    this.started = false;
  }

  get announceUrls() {
    const local = [`http://${this.announceHost}:${this.trackerPort}/announce`];
    if (this.mode === 'public') {
      return [...local, ...PUBLIC_TRACKERS];
    }
    return local; // private: local tracker only
  }

  get dhtNodes() {
    return this.mode === 'public' ? PUBLIC_DHT_NODES : [];
  }

  async start() {
    if (this.started) return;
    await mkdir(this.uploadDir, { recursive: true });

    // --- real tracker ---
    this.tracker = new Tracker({
      udp: this.mode === 'public', // UDP tracker only useful on public net
      ws: false,
      http: true,
      httpPort: this.trackerPort,
    });
    this.tracker.listen(this.trackerPort);
    await new Promise((res) => this.tracker.on('listening', res));

    // --- real WebTorrent seeder client ---
    const clientOpts = {
      tracker: { announce: this.announceUrls },
      torrentPort: this.torrentPort,
      lsd: true, // LAN peer discovery (works in both modes)
    };
    if (this.mode === 'public') {
      clientOpts.tracker.dht = { nodes: this.dhtNodes };
    } else {
      clientOpts.tracker.dht = false; // private: no public DHT
    }
    this.client = new WebTorrent(clientOpts);

    this.started = true;
    console.log(`[Network] mode=${this.mode} tracker=:${this.trackerPort} torrent=:${this.torrentPort}`);
    console.log(`[Network] announce=${this.announceUrls.join(', ')}`);
  }

  /**
   * Seed a file and return a REAL infoHash + magnet URI.
   */
  async seedFile(filePath, name) {
    if (!this.started) await this.start();
    const displayName = name || basename(filePath);
    const torrent = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('seed timeout')), 30000);
      this.client.seed(filePath, { name: displayName, announce: this.announceUrls }, (torr) => {
        clearTimeout(t);
        resolve(torr);
      });
    });

    const result = {
      infoHash: torrent.infoHash,
      magnetURI: torrent.magnetURI,
      name: torrent.name,
      size: torrent.length,
      filePath,
    };
    this.torrents.set(torrent.infoHash, result);
    console.log(`[Network] Seeding "${displayName}" infoHash=${torrent.infoHash.slice(0, 12)}... (${torrent.length} bytes)`);
    return result;
  }

  /**
   * Seed from an in-memory buffer (no temp file needed).
   */
  async seedBuffer(buffer, name) {
    if (!this.started) await this.start();
    const torrent = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('seed timeout')), 30000);
      this.client.seed(buffer, { name, announce: this.announceUrls }, (torr) => {
        clearTimeout(t);
        resolve(torr);
      });
    });
    const result = {
      infoHash: torrent.infoHash,
      magnetURI: torrent.magnetURI,
      name: torrent.name,
      size: torrent.length,
      filePath: '',
    };
    this.torrents.set(torrent.infoHash, result);
    return result;
  }

  getTorrent(infoHash) {
    return this.torrents.get(infoHash);
  }

  getActiveTorrents() {
    return Array.from(this.torrents.values());
  }

  async stopSeeding(infoHash) {
    const t = this.client?.get(infoHash);
    if (t) t.destroy();
    this.torrents.delete(infoHash);
  }

  async stop() {
    if (this.client) this.client.destroy();
    if (this.tracker) this.tracker.close();
    this.started = false;
  }
}

// Singleton
let instance = null;
export function getNetworkService(config) {
  if (!instance) instance = new NetworkService(config);
  return instance;
}
export function createNetworkService(config) {
  if (instance) instance.stop();
  instance = new NetworkService(config);
  return instance;
}
