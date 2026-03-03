/**
 * P2P Node implementation using libp2p
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mdns } from '@libp2p/mdns';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@libp2p/yamux';
import { kadDHT } from '@libp2p/kad-dht';
import { ping } from '@libp2p/ping';
import { P2PNodeConfig, Peer, P2PMessage, P2PEvent, Protocol } from './types';

export class P2PNode {
  private node: any;
  private config: P2PNodeConfig;
  private eventHandlers: Map<string, ((event: P2PEvent) => void)[]> = new Map();
  private peerInfo: Map<string, Peer> = new Map();

  constructor(config: P2PNodeConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    // Create libp2p node
    this.node = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${this.config.port || 4001}`],
      },
      transports: [tcp()],
      connectionEncryption: [noise()],
      streamMuxers: [yamux()],
      dht: this.config.enableDHT !== false ? kadDHT() : undefined,
      peerDiscovery: this.config.enableMDNS !== false ? [mdns()] : [],
      services: {
        ping: ping(),
      },
    });

    // Setup protocol handlers
    this.setupProtocolHandlers();

    // Setup event listeners
    this.node.addEventListener('peer:connect', (event: any) => {
      this.handlePeerConnect(event);
    });

    this.node.addEventListener('peer:disconnect', (event: any) => {
      this.handlePeerDisconnect(event);
    });

    // Start the node
    await this.node.start();

    console.log(`P2P Node started with ID: ${this.node.peerId.toString()}`);
    console.log(`Listening on: ${this.node.getMultiaddrs().map((m: any) => m.toString()).join(', ')}`);

    // Connect to bootstrap peers
    if (this.config.bootstrapPeers) {
      await this.connectToBootstrapPeers();
    }
  }

  async stop(): Promise<void> {
    if (this.node) {
      await this.node.stop();
      console.log('P2P Node stopped');
    }
  }

  private setupProtocolHandlers(): void {
    // Message protocol
    this.node.handle(Protocol.SKIPPSTER_MESSAGE, async ({ stream, connection }: any) => {
      this.handleProtocolMessage(Protocol.SKIPPSTER_MESSAGE, stream, connection);
    });

    // Sync protocol
    this.node.handle(Protocol.SKIPPSTER_SYNC, async ({ stream, connection }: any) => {
      this.handleProtocolMessage(Protocol.SKIPPSTER_SYNC, stream, connection);
    });

    // Discovery protocol
    this.node.handle(Protocol.SKIPPSTER_DISCOVERY, async ({ stream, connection }: any) => {
      this.handleProtocolMessage(Protocol.SKIPPSTER_DISCOVERY, stream, connection);
    });

    // Video protocol
    this.node.handle(Protocol.SKIPPSTER_VIDEO, async ({ stream, connection }: any) => {
      this.handleProtocolMessage(Protocol.SKIPPSTER_VIDEO, stream, connection);
    });
  }

  private async handleProtocolMessage(
    protocol: string,
    stream: any,
    connection: any
  ): Promise<void> {
    try {
      const reader = new TextDecoderStream();
      const readerStream = stream.pipeThrough(reader);

      for await (const data of readerStream) {
        const message: P2PMessage = JSON.parse(data);
        this.emit('message:received', {
          type: 'message:received',
          peerId: connection.remotePeer.toString(),
          data: { protocol, message },
        });
      }
    } catch (error) {
      console.error(`Error handling ${protocol} message:`, error);
    }
  }

  private handlePeerConnect(event: any): void {
    const peerId = event.detail.remotePeer.toString();
    console.log(`Peer connected: ${peerId}`);

    this.emit('peer:connect', {
      type: 'peer:connect',
      peerId,
    });
  }

  private handlePeerDisconnect(event: any): void {
    const peerId = event.detail.remotePeer.toString();
    console.log(`Peer disconnected: ${peerId}`);

    this.emit('peer:disconnect', {
      type: 'peer:disconnect',
      peerId,
    });
  }

  async connectToBootstrapPeers(): Promise<void> {
    if (!this.config.bootstrapPeers || this.config.bootstrapPeers.length === 0) {
      return;
    }

    const { multiaddr } = await import('multiformats');

    for (const addr of this.config.bootstrapPeers) {
      try {
        const ma = multiaddr(addr);
        await this.node.dial(ma);
        console.log(`Connected to bootstrap peer: ${addr}`);
      } catch (error) {
        console.error(`Failed to connect to bootstrap peer ${addr}:`, error);
      }
    }
  }

  async sendMessage(
    protocol: Protocol,
    message: P2PMessage,
    peerId?: string
  ): Promise<void> {
    if (!this.node) {
      throw new Error('Node not started');
    }

    // Add timestamp and signature
    const signedMessage: P2PMessage = {
      ...message,
      timestamp: Date.now(),
    };

    const messageStr = JSON.stringify(signedMessage);

    if (peerId) {
      // Send to specific peer
      try {
        const stream = await this.node.dialProtocol(peerId, protocol);
        const writer = new TextEncoderStream();
        const writable = writer.readable.pipeTo(stream);

        writer.writable.getWriter().write(messageStr);
        await writable;
      } catch (error) {
        console.error(`Failed to send message to ${peerId}:`, error);
        throw error;
      }
    } else {
      // Broadcast to all connected peers
      const connections = this.node.getConnections();
      for (const conn of connections) {
        try {
          const stream = await conn.newStream(protocol);
          const writer = new TextEncoderStream();
          const writable = writer.readable.pipeTo(stream);

          writer.writable.getWriter().write(messageStr);
          await writable;
        } catch (error) {
          console.error(`Failed to broadcast message:`, error);
        }
      }
    }
  }

  async broadcastMessage(protocol: Protocol, message: P2PMessage): Promise<void> {
    await this.sendMessage(protocol, message);
  }

  getPeerId(): string {
    return this.node?.peerId?.toString() || '';
  }

  getMultiaddrs(): string[] {
    return this.node?.getMultiaddrs().map((m: any) => m.toString()) || [];
  }

  getConnectedPeers(): string[] {
    return this.node?.getConnections().map((c: any) => c.remotePeer.toString()) || [];
  }

  on(event: string, handler: (event: P2PEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler: (event: P2PEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, eventData: P2PEvent): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(eventData));
    }
  }

  async findPeers(did?: string): Promise<Peer[]> {
    if (this.config.enableDHT === false) {
      return [];
    }

    try {
      const results = await this.node.services.dht.findProviders(did || this.config.did);
      return results.map((r: any) => ({
        id: r.id.toString(),
        did: '',
        addrs: [],
        protocols: [],
        lastSeen: new Date(),
      }));
    } catch {
      return [];
    }
  }

  async provide(key: string): Promise<void> {
    if (this.node?.services?.dht) {
      await this.node.services.dht.provide(key);
    }
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    if (this.node?.services?.dht) {
      await this.node.services.dht.put(key, value);
    }
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    if (this.node?.services?.dht) {
      return await this.node.services.dht.get(key);
    }
    return undefined;
  }
}