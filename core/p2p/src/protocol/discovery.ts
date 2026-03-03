/**
 * P2P Discovery Protocol
 * Handles peer discovery and content discovery
 */

import { P2PNode } from '../node/libp2p';
import { Protocol, P2PMessage } from '../node/types';

export interface DiscoveryMessage {
  type: 'announce' | 'query' | 'response';
  did?: string;
  content?: {
    videos?: string[];
    posts?: string[];
  };
  query?: string;
}

export class DiscoveryProtocol {
  private node: P2PNode;
  private knownContent: Map<string, Set<string>> = new Map(); // did -> content IDs
  private callbacks: Map<string, (content: string[]) => void> = new Map();

  constructor(node: P2PNode) {
    this.node = node;
    this.setupListener();
  }

  private setupListener(): void {
    this.node.on('message:received', ({ data }: any) => {
      if (data.protocol === Protocol.SKIPPSTER_DISCOVERY) {
        this.handleDiscoveryMessage(data.message);
      }
    });
  }

  private async handleDiscoveryMessage(message: P2PMessage): Promise<void> {
    const payload = message.payload as DiscoveryMessage;

    switch (payload.type) {
      case 'announce':
        // Track announced content
        if (payload.did && payload.content) {
          this.updateKnownContent(payload.did, payload.content);
        }
        break;

      case 'query':
        // Respond with known content for the query
        if (payload.query && message.from) {
          const results = this.searchContent(payload.query);
          const response: P2PMessage = {
            from: this.node.getPeerId(),
            protocol: Protocol.SKIPPSTER_DISCOVERY,
            payload: {
              type: 'response',
              content: { videos: results.videos, posts: results.posts },
            },
          };
          await this.node.sendMessage(Protocol.SKIPPSTER_DISCOVERY, response, message.from);
        }
        break;

      case 'response':
        // Handle query response
        if (message.from) {
          const callback = this.callbacks.get(message.from);
          if (callback && payload.content) {
            const allContent = [
              ...(payload.content.videos || []),
              ...(payload.content.posts || []),
            ];
            callback(allContent);
            this.callbacks.delete(message.from);
          }
        }
        break;
    }
  }

  announce(did: string, content: { videos?: string[]; posts?: string[] }): void {
    const message: P2PMessage = {
      from: this.node.getPeerId(),
      protocol: Protocol.SKIPPSTER_DISCOVERY,
      payload: {
        type: 'announce',
        did,
        content,
      },
    };
    this.node.broadcastMessage(Protocol.SKIPPSTER_DISCOVERY, message);
  }

  async searchVideos(query: string): Promise<string[]> {
    return new Promise((resolve) => {
      const message: P2PMessage = {
        from: this.node.getPeerId(),
        protocol: Protocol.SKIPPSTER_DISCOVERY,
        payload: {
          type: 'query',
          query,
        },
      };

      // Collect results from peers
      const allResults: string[] = new Set();
      let pendingResponses = this.node.getConnectedPeers().length;

      const callback = (content: string[]) => {
        content.forEach((id) => allResults.add(id));
        pendingResponses--;
        if (pendingResponses <= 0) {
          resolve(Array.from(allResults));
        }
      };

      // Register callback
      this.node.getConnectedPeers().forEach((peerId) => {
        this.callbacks.set(peerId, callback);
      });

      this.node.broadcastMessage(Protocol.SKIPPSTER_DISCOVERY, message);

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(Array.from(allResults));
      }, 5000);
    });
  }

  private searchContent(query: string): { videos: string[]; posts: string[] } {
    const videos: string[] = [];
    const posts: string[] = [];

    for (const [did, contentIds] of this.knownContent) {
      for (const id of contentIds) {
        if (id.toLowerCase().includes(query.toLowerCase())) {
          if (id.startsWith('video:')) {
            videos.push(id.replace('video:', ''));
          } else {
            posts.push(id);
          }
        }
      }
    }

    return { videos, posts };
  }

  private updateKnownContent(did: string, content: { videos?: string[]; posts?: string[] }): void {
    if (!this.knownContent.has(did)) {
      this.knownContent.set(did, new Set());
    }

    const contentIds = this.knownContent.get(did)!;
    (content.videos || []).forEach((v) => contentIds.add(`video:${v}`));
    (content.posts || []).forEach((p) => contentIds.add(p));
  }

  getKnownContent(did: string): string[] {
    return Array.from(this.knownContent.get(did) || []);
  }
}