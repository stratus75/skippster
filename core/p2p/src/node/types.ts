/**
 * P2P Node types
 */

export interface P2PNodeConfig {
  did: string;
  port?: number;
  bootstrapPeers?: string[];
  enableMDNS?: boolean;
  enableDHT?: boolean;
  enableWebRTC?: boolean;
}

export interface Peer {
  id: string;
  did: string;
  addrs: string[];
  protocols: string[];
  lastSeen: Date;
}

export interface P2PMessage {
  from: string;
  to?: string;
  protocol: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

export interface P2PEvent {
  type: 'peer:connect' | 'peer:disconnect' | 'message:received' | 'stream:opened';
  peerId?: string;
  data?: any;
}

export enum Protocol {
  SKIPPSTER_MESSAGE = '/skippster/msg/1.0.0',
  SKIPPSTER_SYNC = '/skippster/sync/1.0.0',
  SKIPPSTER_DISCOVERY = '/skippster/discover/1.0.0',
  SKIPPSTER_VIDEO = '/skippster/video/1.0.0',
}