/**
 * P2P Node Configuration
 */

export interface P2PNodeConfig {
  peerId?: string;
  listenAddresses?: string[];
  bootstrapPeers?: string[];
  enableMDNS?: boolean;
  enableWebRTC?: boolean;
  enableWebTransport?: boolean;
  enableDHT?: boolean;
  enableRelay?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export const DEFAULT_P2P_CONFIG: P2PNodeConfig = {
  listenAddresses: ['/ip4/0.0.0.0/tcp/0', '/ip4/127.0.0.1/tcp/0'],
  bootstrapPeers: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTm',
  ],
  enableMDNS: true,
  enableWebRTC: true,
  enableWebTransport: false, // Requires HTTPS in production
  enableDHT: true,
  enableRelay: true,
  maxConnections: 50,
  connectionTimeout: 30000, // 30 seconds
};

export interface PeerInfo {
  id: string;
  addrs: string[];
  protocols: string[];
  connected: boolean;
  lastSeen: Date;
}

export interface MessageEnvelope {
  from: string;
  to?: string; // Optional for broadcasts
  type: string;
  payload: any;
  timestamp: number;
  signature?: string;
}