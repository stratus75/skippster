/**
 * Shared types for Skippster platform
 */

// === DID and Identity ===

export interface DID {
  did: string; // did:plc:abc123...
  handle: string; // @alice.skippster.social
  verificationMethods: VerificationMethod[];
  services: Service[];
}

export interface VerificationMethod {
  id: string;
  type: 'Multikey' | 'EcdsaSecp256k1VerificationKey2019';
  publicKeyMultibase: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  alsoKnownAs?: string[];
  verificationMethod: VerificationMethod[];
  service?: Service[];
}

export enum DIDMethod {
  PLC = 'plc', // Primary Ledger Control (AT Protocol style)
  KEY = 'key', // Web Key
  WEB = 'web', // Web Domain
}

export enum DIDResolver {
  LOCAL = 'local',
  NETWORK = 'network',
  IPFS = 'ipfs',
}

// === Content ===

export interface CID {
  value: string; // IPFS CID
}

export interface MagnetLink {
  infoHash: string;
  announce: string[];
  xt?: string[];
}

export interface VideoMetadata {
  id: string;
  cid: CID;
  magnet: MagnetLink;
  title: string;
  description: string;
  thumbnailCID?: CID;
  duration: number; // seconds
  createdAt: Date;
  creatorDID: string;
  tags: string[];
  monetization: MonetizationType;
  price?: number;
  currency?: string;
}

export interface Post {
  id: string;
  authorDID: string;
  content: string;
  media?: CID[];
  videoId?: string;
  privacy: PrivacyLevel;
  createdAt: Date;
  updatedAt: Date;
  reactions?: Reaction[];
  comments?: Comment[];
  shares?: number;
}

export interface Comment {
  id: string;
  authorDID: string;
  targetType: 'video' | 'post';
  targetId: string;
  parentId?: string;
  content: string;
  createdAt: Date;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  authorDID: string;
  targetType: 'video' | 'post';
  targetId: string;
  emoji: string;
  createdAt: Date;
}

// === Monetization ===

export enum MonetizationType {
  Free = 'free',
  Donations = 'donations',
  PayPerView = 'payperview',
  Subscription = 'subscription',
}

export interface Payment {
  id: string;
  fromDID: string;
  toDID: string;
  amount: number;
  currency: 'SATS' | 'BTC' | 'SOL' | 'USD';
  type: 'donation' | 'purchase' | 'subscription';
  transactionId: string;
  timestamp: Date;
}

export interface WalletAddress {
  lightning?: string; // alice@wallet.skippster.social
  solana?: string; // Solana public key
}

// === Marketplace ===

export interface MarketplaceItem {
  id: string;
  sellerDID: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'BTC' | 'SOL';
  category: MarketplaceCategory;
  images?: CID[];
  location?: string;
  status: 'active' | 'sold' | 'reserved';
  createdAt: Date;
}

export enum MarketplaceCategory {
  Items = 'items',
  Services = 'services',
  Housing = 'housing',
}

// === Social ===

export enum PrivacyLevel {
  Public = 'public',
  Friends = 'friends',
  Group = 'group',
  Specific = 'specific',
}

export interface FriendRequest {
  id: string;
  fromDID: string;
  toDID: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorDID: string;
  members: string[]; // DIDs
  posts: string[]; // Post IDs
  privacy: PrivacyLevel;
  createdAt: Date;
}

export interface Message {
  id: string;
  fromDID: string;
  toDID: string;
  groupId?: string;
  content: string;
  encrypted: boolean;
  nonce?: string;
  timestamp: Date;
  read: boolean;
}

// === Agent Permissions ===

export interface AgentPermission {
  scope: string; // e.g., "tube:read", "social:post"
  granted: boolean;
  revokedAt?: Date;
  limits?: PermissionLimits;
}

export interface PermissionLimits {
  maxAmount?: number; // For payments
  maxActionsPerDay?: number;
  allowedTargets?: string[]; // Specific DIDs
}

export interface AgentAction {
  id: string;
  type: string;
  scope: string;
  data: unknown;
  signature: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'declined' | 'executed';
  executionResult?: unknown;
}

// === P2P ===

export interface Peer {
  did: string;
  multiaddrs: string[];
  lastSeen: Date;
  protocols: string[];
}

export interface P2PMessage {
  fromDID: string;
  toDID: string;
  type: string;
  payload: unknown;
  timestamp: Date;
  signature: string;
}

// === Analytics ===

export interface VideoAnalytics {
  videoId: string;
  views: number;
  uniqueViewers: number;
  watchTime: number; // seconds
  likes: number;
  shares: number;
  revenue: number;
  periodStart: Date;
  periodEnd: Date;
}

// === Notifications ===

export interface Notification {
  id: string;
  toDID: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  NewSubscriber = 'new_subscriber',
  NewComment = 'new_comment',
  NewLike = 'new_like',
  FriendRequest = 'friend_request',
  FriendAccepted = 'friend_accepted',
  NewMessage = 'new_message',
  DonationReceived = 'donation_received',
  SaleCompleted = 'sale_completed',
}