/**
 * IPFS Manager - Integration stub for content-addressed storage
 * Handles video content pinning and retrieval via IPFS
 */

import { create } from 'ipfs-http-client';
import { fromString, toString } from 'uint8arrays';
import { randomBytes } from 'crypto';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';

export interface IpfsConfig {
  url?: string;
  pinDir?: string;
  maxFileSize?: number; // bytes
}

export interface IpfsUploadResult {
  cid: string;
  size: number;
  filename: string;
  timestamp: Date;
}

export interface IpfsPinStatus {
  cid: string;
  pinned: boolean;
  size: number;
  timestamp: Date;
}

/**
 * IpfsManager handles content-addressed storage operations
 * Provides stub implementation that can be connected to real IPFS
 */
export class IpfsManager {
  private client: any = null;
  private config: Required<IpfsConfig>;
  private pinsDir: string;
  private pinnedCids: Map<string, IpfsPinStatus> = new Map();

  constructor(config: IpfsConfig = {}) {
    this.config = {
      url: config.url || process.env.IPFS_URL || 'http://localhost:5001/api/v0',
      pinDir: config.pinDir || './pinned-content',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024 * 1024, // 10GB default
    };
    this.pinsDir = this.config.pinDir;
  }

  /**
   * Initialize IPFS client connection
   */
  async initialize(): Promise<void> {
    try {
      // Try to create IPFS client
      this.client = create({
        url: this.config.url,
        timeout: 60000,
      });

      // Test connection
      await this.client.id();
      console.log('[IpfsManager] Connected to IPFS node');
    } catch (error: any) {
      console.warn('[IpfsManager] IPFS not available, using local stub mode:', error.message);
      this.client = null;
    }

    // Ensure pins directory exists
    try {
      await mkdir(this.pinsDir, { recursive: true });
    } catch {}
  }

  /**
   * Check if IPFS is available
   */
  isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * Add file to IPFS and pin it locally
   */
  async addFile(buffer: Buffer, filename: string): Promise<IpfsUploadResult> {
    const timestamp = new Date();

    // Check file size
    if (buffer.length > this.config.maxFileSize) {
      throw new Error(`File too large: ${buffer.length} bytes (max: ${this.config.maxFileSize})`);
    }

    let cid: string;

    if (this.client) {
      // Use real IPFS
      const result = await this.client.add({
        path: filename,
        content: buffer,
      });
      cid = result.cid.toString();

      // Pin the content
      await this.client.pin.add(cid);
      console.log(`[IpfsManager] Added and pinned: ${cid}`);
    } else {
      // Stub mode: generate fake CID
      const hash = await this.computeStubHash(buffer, filename);
      cid = hash;

      // Save to local pins directory
      const filePath = join(this.pinsDir, `${cid}-${filename}`);
      await writeFile(filePath, buffer);
      console.log(`[IpfsManager] Stub mode: saved locally as ${filePath}`);
    }

    const result: IpfsUploadResult = {
      cid,
      size: buffer.length,
      filename,
      timestamp,
    };

    // Track pin status
    this.pinnedCids.set(cid, {
      cid,
      pinned: true,
      size: buffer.length,
      timestamp,
    });

    return result;
  }

  /**
   * Add buffer data to IPFS (convenience method)
   */
  async addData(data: string | Uint8Array, filename?: string): Promise<IpfsUploadResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const name = filename || `data-${Date.now()}.txt`;
    return this.addFile(buffer, name);
  }

  /**
   * Retrieve content from IPFS
   */
  async getContent(cid: string): Promise<Uint8Array> {
    if (this.client) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } else {
      // Stub mode: try local pins directory
      const files = await this.listPinnedFiles();
      for (const file of files) {
        if (file.cid === cid) {
          const filePath = join(this.pinsDir, file.filename);
          try {
            return await readFile(filePath);
          } catch {
            break;
          }
        }
      }
      throw new Error(`Content not found: ${cid}`);
    }
  }

  /**
   * Get content as string
   */
  async getContentString(cid: string): Promise<string> {
    const data = await this.getContent(cid);
    return toString(data);
  }

  /**
   * Pin content to local node
   */
  async pin(cid: string): Promise<boolean> {
    if (this.client) {
      try {
        await this.client.pin.add(cid);
        this.updatePinStatus(cid, true);
        return true;
      } catch {
        return false;
      }
    } else {
      // Stub mode - already locally saved
      this.updatePinStatus(cid, true);
      return true;
    }
  }

  /**
   * Unpin content
   */
  async unpin(cid: string): Promise<boolean> {
    if (this.client) {
      try {
        await this.client.pin.rm(cid);
        this.updatePinStatus(cid, false);
        return true;
      } catch {
        return false;
      }
    } else {
      this.updatePinStatus(cid, false);
      return true;
    }
  }

  /**
   * Check if content is pinned
   */
  async isPinned(cid: string): Promise<boolean> {
    const status = this.pinnedCids.get(cid);
    if (status) return status.pinned;

    if (this.client) {
      try {
        const pinned = await this.client.pin.isPinned(cid);
        return pinned;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * List all pinned content
   */
  async listPinned(): Promise<IpfsPinStatus[]> {
    const localStatuses = Array.from(this.pinnedCids.values());

    if (this.client) {
      try {
        const pins: any[] = [];
        for await (const pin of (this.client as any).pin.listAll()) {
          pins.push(pin);
        }
        // Merge with local tracking
        return localStatuses;
      } catch {
        return localStatuses;
      }
    }

    return localStatuses;
  }

  /**
   * List pinned files in local storage (stub mode)
   */
  async listPinnedFiles(): Promise<Array<{ cid: string; filename: string; size: number }>> {
    const files: Array<{ cid: string; filename: string; size: number }> = [];
    try {
      const { readdir, stat } = await import('fs/promises');
      const entries = await readdir(this.pinsDir);
      for (const entry of entries) {
        const [cid, ...nameParts] = entry.split('-');
        if (cid && nameParts.length > 0) {
          const filename = nameParts.join('-');
          const fileStat = await stat(join(this.pinsDir, entry));
          files.push({ cid, filename, size: fileStat.size });
        }
      }
    } catch {}
    return files;
  }

  /**
   * Get IPFS gateway URL for content
   */
  getGatewayUrl(cid: string, filename?: string): string {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io';
    if (filename) {
      return `${gateway}/ipfs/${cid}/${filename}`;
    }
    return `${gateway}/ipfs/${cid}`;
  }

  /**
   * Create a DAG node with metadata
   */
  async createDagNode(data: Record<string, any>): Promise<string> {
    if (!this.client) {
      // Stub: return fake CID
      const hash = await this.computeStubHash(Buffer.from(JSON.stringify(data)), 'dag-node.json');
      return hash;
    }

    const result = await this.client.dag.put(data);
    return result.toString();
  }

  /**
   * Get DAG node
   */
  async getDagNode(cid: string): Promise<any> {
    if (!this.client) {
      throw new Error('DAG operations require real IPFS connection');
    }
    return await this.client.dag.get(cid);
  }

  /**
   * Get stats for IPFS node
   */
  async getStats(): Promise<{
    connected: boolean;
    pinnedCount: number;
    totalSize: number;
  }> {
    const pinned = await this.listPinned();
    const totalSize = pinned.reduce((sum, p) => sum + p.size, 0);

    return {
      connected: this.client !== null,
      pinnedCount: pinned.length,
      totalSize,
    };
  }

  /**
   * Shutdown manager
   */
  async shutdown(): Promise<void> {
    console.log('[IpfsManager] Shutting down');
    this.pinnedCids.clear();
  }

  // Private helpers

  private updatePinStatus(cid: string, pinned: boolean): void {
    const existing = this.pinnedCids.get(cid);
    if (existing) {
      existing.pinned = pinned;
    } else {
      this.pinnedCids.set(cid, {
        cid,
        pinned,
        size: 0,
        timestamp: new Date(),
      });
    }
  }

  private async computeStubHash(buffer: Buffer, filename: string): Promise<string> {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256')
      .update(buffer)
      .update(filename)
      .update(Date.now().toString())
      .digest();
    return 'bafkstub' + hash.toString('hex').slice(0, 44);
  }
}

// Singleton instance
let ipfsManagerInstance: IpfsManager | null = null;

export function getIpfsManager(config?: IpfsConfig): IpfsManager {
  if (!ipfsManagerInstance) {
    ipfsManagerInstance = new IpfsManager(config);
  }
  return ipfsManagerInstance;
}

export function createIpfsManager(config?: IpfsConfig): IpfsManager {
  if (ipfsManagerInstance) {
    ipfsManagerInstance.shutdown();
  }
  ipfsManagerInstance = new IpfsManager(config);
  return ipfsManagerInstance;
}

export default IpfsManager;
