/**
 * IPFS client for PDS
 * Handles content-addressed storage
 */

import { create } from 'ipfs-http-client';
import { fromString, toString } from 'uint8arrays';

let ipfsInstance: any = null;

export function getIPFSClient() {
  if (!ipfsInstance) {
    // Connect to local IPFS node or use default
    ipfsInstance = create({
      url: process.env.IPFS_URL || 'http://localhost:5001/api/v0',
    });
  }
  return ipfsInstance;
}

export const ipfsClient = {
  /**
   * Add content to IPFS
   */
  async add(data: string | Uint8Array): Promise<string> {
    const client = getIPFSClient();
    const result = await client.add(data);
    return result.cid.toString();
  },

  /**
   * Add file with metadata
   */
  async addFile(data: Uint8Array, filename?: string): Promise<{ cid: string; path?: string }> {
    const client = getIPFSClient();
    const result = await client.add({ path: filename || 'file', content: data });
    return {
      cid: result.cid.toString(),
      path: result.path,
    };
  },

  /**
   * Add directory with multiple files
   */
  async addDirectory(files: Array<{ path: string; content: Uint8Array }>): Promise<string> {
    const client = getIPFSClient();
    const results = await client.addAll(files, { wrapWithDirectory: true });

    // Get the directory CID (last result)
    let directoryCid: string | undefined;
    for await (const result of results) {
      if (!result.path) {
        directoryCid = result.cid.toString();
      }
    }

    if (!directoryCid) {
      throw new Error('Failed to create directory');
    }

    return directoryCid;
  },

  /**
   * Get content from IPFS
   */
  async cat(cid: string): Promise<Uint8Array> {
    const client = getIPFSClient();
    const chunks: Uint8Array[] = [];

    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  },

  /**
   * Get content as string
   */
  async catString(cid: string): Promise<string> {
    const data = await this.cat(cid);
    return toString(data);
  },

  /**
   * Pin content to local node
   */
  async pin(cid: string): Promise<void> {
    const client = getIPFSClient();
    await client.pin.add(cid);
  },

  /**
   * Unpin content
   */
  async unpin(cid: string): Promise<void> {
    const client = getIPFSClient();
    await client.pin.rm(cid);
  },

  /**
   * Get DAG (for IPLD data structures)
   */
  async dagGet(cid: string): Promise<any> {
    const client = getIPFSClient();
    return await client.dag.get(cid);
  },

  /**
   * Put DAG node
   */
  async dagPut(obj: any): Promise<string> {
    const client = getIPFSClient();
    const result = await client.dag.put(obj);
    return result.toString();
  },

  /**
   * Check if CID is available locally
   */
  async isPinned(cid: string): Promise<boolean> {
    try {
      const client = getIPFSClient();
      const isPinned = await client.pin.isPinned(cid);
      return isPinned;
    } catch {
      return false;
    }
  },
};