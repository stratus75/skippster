/**
 * P2P Node implementation using libp2p
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { tls } from '@libp2p/tls';
import { yamux } from '@libp2p/yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { mdns } from '@libp2p/mdns';
import { dht } from '@libp2p/kad-dht';
import { webRTC } from '@libp2p/webrtc';
import { webTransport } from '@libp2p/webtransport';
import { ping } from '@libp2p/ping';
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { kadDHT } from '@libp2p/kad-dht';
import { autoNAT } from '@libp2p/autonat';
import { identify, identifyPush } from '@libp2p/identify';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import type { Libp2p } from 'libp2p';

import { P2PNodeConfig, PeerInfo, MessageEnvelope, DEFAULT_P2P_CONFIG } from './config';
import { EncryptionService } from '../encryption/service';

export class P2PNode {
  private libp2p: Libp2p | null = null;
  private encryption: EncryptionService;
  private config: Required<P2PNodeConfig>;
  private messageHandlers: Map<string, (envelope: MessageEnvelope) => void> = new Map();
  private peerInfo: Map<string, PeerInfo> = new Map();

  constructor(config: P2PNodeConfig = {}, privateKey?: Uint8Array) {
    this.config = { ...DEFAULT_P2P_CONFIG, ...config } as Required<P2PNodeConfig>;
    this.encryption = new EncryptionService(privateKey);
  }

  /**
   * Start the P2P node
   */
  async start(): Promise<string> {
    const transports = [];

    // TCP transport
    transports.push(tcp());

    // WebRTC (for browsers)
    if (this.config.enableWebRTC) {
      transports.push(webRTC());
    }

    // WebTransport (requires HTTPS)
    if (this.config.enableWebTransport) {
      transports.push(webTransport());
    }

    // Stream multiplexers
    const streamMuxers = [yamux()];

    // Connection encryption
    const connectionEncrypters = [noise()];

    // Peer discovery
    const peerDiscovery = [];

    if (this.config.enableMDNS) {
      peerDiscovery.push(mdns());
    }

    // DHT
    const dhtConfig = this.config.enableDHT
      ? {
          dht: kadDHT({
            validators: {
              // Add validators for your protocol
            },
          }),
        }
      : {};

    // Create libp2p node
    this.libp2p = await createLibp2p({
      addresses: {
        listen: this.config.listenAddresses,
      },
      transports,
      streamMuxers,
      connectionEncrypters,
      peerDiscovery,
      services: {
        identify: identify(),
        identifyPush: identifyPush(),
        ping: ping(),
        autoNAT: autoNAT(),
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
        }),
        ...dhtConfig,
      },
    });

    // Set up event handlers
    this.libp2p.addEventListener('peer:connect', (event) => {
      this.handlePeerConnect(event.detail);
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      this.handlePeerDisconnect(event.detail);
    });

    // Start the node
    await this.libp2p.start();

    // Connect to bootstrap peers
    if (this.config.bootstrapPeers) {
      await this.connectToBootstrapPeers();
    }

    // Set up protocol handlers
    this.setupProtocolHandlers();

    return this.libp2p.peerId.toString();
  }

  /**
   * Stop the P2P node
   */
  async stop(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.stop();
      this.libp2p = null;
    }
  }

  /**
   * Get peer ID
   */
  getPeerId(): string | null {
    return this.libp2p?.peerId.toString() || null;
  }

  /**
   * Get multiaddresses
   */
  getMultiaddrs(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getMultiaddrs().map((ma) => ma.toString());
  }

  /**
   * Connect to a peer by multiaddress
   */
  async connect(multiaddr: string): Promise<void> {
    if (!this.libp2p) throw new Error('Node not started');
    await this.libp2p.dial(multiaddr);
  }

  /**
   * Connect to a peer by ID
   */
  async connectById(peerId: string): Promise<void> {
    if (!this.libp2p) throw new Error('Node not started');
    await this.libp2p.dial(peerId);
  }

  /**
   * Get connected peers
   */
  getPeers(): PeerInfo[] {
    if (!this.libp2p) return [];

    const peers = this.libp2p.getPeers();
    return peers.map((peer) => {
      const info = this.peerInfo.get(peer.toString());
      return {
        id: peer.toString(),
        addrs: this.libp2p!.getMultiaddrsForPeer(peer).map((ma) => ma.toString()),
        protocols: this.libp2p!.getProtocols(),
        connected: true,
        lastSeen: info?.lastSeen || new Date(),
      };
    });
  }

  /**
   * Send a message to a specific peer
   */
  async sendMessage(peerId: string, type: string, payload: any, sign = true): Promise<void> {
    if (!this.libp2p) throw new Error('Node not started');

    const envelope: MessageEnvelope = {
      from: this.getPeerId()!,
      to: peerId,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (sign) {
      envelope.signature = this.encryption.sign(JSON.stringify(envelope));
    }

    const stream = await this.libp2p.dialProtocol(peerId, `/skippster/${type}`);
    const encoded = new TextEncoder().encode(JSON.stringify(envelope));
    await stream.sink([encoded]);
  }

  /**
   * Broadcast a message to all peers
   */
  async broadcast(type: string, payload: any, sign = true): Promise<void> {
    if (!this.libp2p) throw new Error('Node not started');

    const envelope: MessageEnvelope = {
      from: this.getPeerId()!,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (sign) {
      envelope.signature = this.encryption.sign(JSON.stringify(envelope));
    }

    const message = new TextEncoder().encode(JSON.stringify(envelope));

    // Use pubsub for broadcast
    this.libp2p.services.pubsub.publish(`skippster-${type}`, message);
  }

  /**
   * Subscribe to message type
   */
  onMessage(type: string, handler: (envelope: MessageEnvelope) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Subscribe to pubsub topic
   */
  subscribe(topic: string): void {
    if (!this.libp2p) return;
    this.libp2p.services.pubsub.subscribe(`skippster-${topic}`);
  }

  /**
   * Find providers for a CID
   */
  async findProviders(cid: string): Promise<PeerInfo[]> {
    if (!this.libp2p) return [];

    try {
      const providers = await this.libp2p.services.dht.findProviders(cid);
      return providers.map((provider) => ({
        id: provider.id.toString(),
        addrs: provider.multiaddrs.map((ma) => ma.toString()),
        protocols: [],
        connected: false,
        lastSeen: new Date(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Provide content to the DHT
   */
  async provide(cid: string): Promise<void> {
    if (!this.libp2p) return;
    try {
      await this.libp2p.services.dht.provide(new Uint8Array([1, 2, 3, 4]), cid);
    } catch (error) {
      console.error('Failed to provide:', error);
    }
  }

  private async connectToBootstrapPeers(): Promise<void> {
    for (const addr of this.config.bootstrapPeers) {
      try {
        await this.connect(addr);
      } catch (error) {
        console.warn(`Failed to connect to bootstrap peer ${addr}:`, error);
      }
    }
  }

  private handlePeerConnect(detail: { remotePeer: any }): void {
    const peerId = detail.remotePeer.toString();
    this.peerInfo.set(peerId, {
      id: peerId,
      addrs: [],
      protocols: [],
      connected: true,
      lastSeen: new Date(),
    });
    console.log(`Peer connected: ${peerId}`);
  }

  private handlePeerDisconnect(detail: { remotePeer: any }): void {
    const peerId = detail.remotePeer.toString();
    const info = this.peerInfo.get(peerId);
    if (info) {
      info.connected = false;
    }
    console.log(`Peer disconnected: ${peerId}`);
  }

  private setupProtocolHandlers(): void {
    if (!this.libp2p) return;

    // Handle incoming messages via protocols
    this.libp2p.handle(['/skippster/*'], async ({ stream, connection }) => {
      const decoder = new TextDecoder();
      let message = '';

      for await (const chunk of stream.source) {
        message += decoder.decode(chunk);
      }

      const envelope = JSON.parse(message) as MessageEnvelope;
      const type = envelope.type.replace('/skippster/', '');

      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(envelope);
      }
    });

    // Handle pubsub messages
    this.libp2p.services.pubsub.addEventListener('message', (event) => {
      const topic = event.detail.topic;
      const type = topic.replace('skippster-', '');
      const envelope = JSON.parse(new TextDecoder().decode(event.detail.data)) as MessageEnvelope;

      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(envelope);
      }
    });
  }
}