/**
 * WebTorrent service for video seeding and magnet link generation
 * Uses a simplified approach that doesn't require native modules
 */

import { createHash, randomBytes } from 'crypto';
import { mkdir, writeFile, unlink, access, readFile } from 'fs/promises';
import { join } from 'path';

export interface TorrentResult {
  magnetURI: string;
  infoHash: string;
  name: string;
  size: number;
}

export interface TorrentProgress {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
}

// Simple bencode encoder for torrent files
function bencode(data: any): Buffer<ArrayBuffer> {
  if (typeof data === 'string') {
    return Buffer.concat([
      Buffer.from(`${data.length}:`),
      Buffer.from(data, 'utf-8'),
    ]);
  }
  if (typeof data === 'number') {
    return Buffer.from(`i${data}e`);
  }
  if (Buffer.isBuffer(data)) {
    return Buffer.concat([
      Buffer.from(`${data.length}:`),
      data,
    ]);
  }
  if (Array.isArray(data)) {
    const parts: Buffer<ArrayBuffer>[] = [Buffer.from('l')];
    for (const item of data) {
      parts.push(bencode(item));
    }
    parts.push(Buffer.from('e'));
    return Buffer.concat(parts);
  }
  if (typeof data === 'object' && data !== null) {
    const parts: Buffer<ArrayBuffer>[] = [Buffer.from('d')];
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      parts.push(bencode(key));
      parts.push(bencode((data as any)[key]));
    }
    parts.push(Buffer.from('e'));
    return Buffer.concat(parts);
  }
  return Buffer.from('');
}

// Convert buffer to hex
function toHex(buffer: Buffer): string {
  return buffer.toString('hex');
}

// Convert buffer to base32 (for xt urn)
function toBase32(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
}

export class TorrentService {
  private uploadsDir: string;
  private torrents: Map<string, { infoHash: string; magnetURI: string; name: string; size: number; filePath: string }> = new Map();

  constructor(uploadsDir = './uploads') {
    this.uploadsDir = uploadsDir;
  }

  /**
   * Initialize and ensure uploads directory exists
   */
  async initialize(): Promise<void> {
    try {
      await access(this.uploadsDir);
    } catch {
      await mkdir(this.uploadsDir, { recursive: true });
    }
    console.log('Torrent service initialized (lightweight mode)');
  }

  /**
   * Generate a unique ID for videos
   */
  generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `vid_${timestamp}_${random}`;
  }

  /**
   * Save uploaded file to disk
   */
  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filePath = join(this.uploadsDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Create a torrent info hash and magnet link from a file
   * This creates a valid magnet link without needing WebTorrent native modules
   */
  async seedFile(filePath: string, name?: string): Promise<TorrentResult> {
    // Read the file
    const fileBuffer = await readFile(filePath);
    const fileName = name || filePath.split('/').pop() || 'video.mp4';
    const fileSize = fileBuffer.length;

    // Create info dictionary (simplified torrent structure)
    // In a real torrent, we'd split into pieces and hash each piece
    // For simplicity, we use the file hash as the info hash
    const pieceLength = 16384; // 16KB pieces
    const pieces: Buffer[] = [];

    for (let i = 0; i < fileSize; i += pieceLength) {
      const piece = fileBuffer.slice(i, Math.min(i + pieceLength, fileSize));
      const pieceHash = createHash('sha1').update(piece).digest();
      pieces.push(pieceHash);
    }

    const info = {
      name: fileName,
      length: fileSize,
      'piece length': pieceLength,
      pieces: Buffer.concat(pieces),
    };

    // Create info_hash from bencoded info
    const infoBencoded = bencode(info);
    const infoHash = createHash('sha1').update(infoBencoded).digest();
    const infoHashHex = toHex(infoHash);
    const infoHashBase32 = toBase32(infoHash);

    // Build magnet URI with trackers
    const trackers = [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
    ];

    const trackerParams = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    const magnetURI = `magnet:?xt=urn:btih:${infoHashHex}&dn=${encodeURIComponent(fileName)}${trackerParams}`;

    // Store torrent info
    this.torrents.set(infoHashHex, {
      infoHash: infoHashHex,
      magnetURI,
      name: fileName,
      size: fileSize,
      filePath,
    });

    console.log(`Created magnet link for: ${fileName}`);
    console.log(`Info hash: ${infoHashHex}`);
    console.log(`Size: ${fileSize} bytes`);

    return {
      magnetURI,
      infoHash: infoHashHex,
      name: fileName,
      size: fileSize,
    };
  }

  /**
   * Get torrent by info hash
   */
  getTorrent(infoHash: string) {
    return this.torrents.get(infoHash);
  }

  /**
   * Get progress for a torrent (simulated for lightweight mode)
   */
  getProgress(infoHash: string): TorrentProgress | null {
    const torrent = this.torrents.get(infoHash);
    if (!torrent) return null;

    // In lightweight mode, we don't track real progress
    return {
      progress: 1,
      downloadSpeed: 0,
      uploadSpeed: 0,
      peers: 0,
    };
  }

  /**
   * Stop seeding a torrent and optionally delete the file
   */
  async stopSeeding(infoHash: string, deleteFile = false): Promise<boolean> {
    const torrent = this.torrents.get(infoHash);
    if (!torrent) return false;

    this.torrents.delete(infoHash);

    if (deleteFile) {
      try {
        await unlink(torrent.filePath);
        console.log(`Deleted file: ${torrent.filePath}`);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }

    return true;
  }

  /**
   * Get all active torrents
   */
  getActiveTorrents(): TorrentResult[] {
    const results: TorrentResult[] = [];
    for (const [_, torrent] of this.torrents) {
      results.push({
        magnetURI: torrent.magnetURI,
        infoHash: torrent.infoHash,
        name: torrent.name,
        size: torrent.size,
      });
    }
    return results;
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    this.torrents.clear();
    console.log('Torrent service shutdown');
  }
}

// Singleton instance
let torrentService: TorrentService | null = null;

export function getTorrentService(uploadsDir?: string): TorrentService {
  if (!torrentService) {
    torrentService = new TorrentService(uploadsDir);
  }
  return torrentService;
}