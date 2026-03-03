/**
 * Skippster P2P Network Layer
 * Decentralized networking using libp2p and WebTorrent
 */

// Node
export { P2PNode } from './node/libp2p';
export type { P2PNodeConfig, Peer, P2PMessage, P2PEvent } from './node/types';
export { Protocol } from './node/types';

// Protocols
export { DiscoveryProtocol } from './protocol/discovery';
export type { DiscoveryMessage } from './protocol/discovery';

// Encryption
export {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifySignature,
  deriveSharedSecret,
  encryptWithShared,
  decryptWithShared,
  hashMessage,
} from './encryption/crypto';
export type { KeyPair, EncryptedMessage } from './encryption/crypto';

// Torrent
export { TorrentClient, getTorrentClient, createMagnetURI, parseMagnetURI } from './torrent/webtorrent';
export type { TorrentInfo, TorrentFile, StreamOptions } from './torrent/webtorrent';

// Helper to create a default P2P node
export function createP2PNode(config: import('./node/types').P2PNodeConfig): P2PNode {
  return new P2PNode(config);
}

import { P2PNode } from './node/libp2p';