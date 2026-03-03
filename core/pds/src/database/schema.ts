/**
 * PDS Database Schema for Skippster
 * SQLite-based local storage
 */

export const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  did TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Videos table (Tube)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_cid TEXT,
  magnet_link TEXT NOT NULL,
  duration INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  tags TEXT,
  monetization_type TEXT DEFAULT 'free',
  price REAL,
  currency TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (did) REFERENCES users(did)
);

-- Posts table (Social)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  content TEXT NOT NULL,
  media_cids TEXT,
  video_id TEXT,
  privacy TEXT DEFAULT 'public',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (did) REFERENCES users(did),
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'video' or 'post'
  target_id TEXT NOT NULL,
  parent_id TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (did) REFERENCES users(did)
);

-- Likes/Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'video' or 'post'
  target_id TEXT NOT NULL,
  emoji TEXT DEFAULT '👍',
  created_at INTEGER NOT NULL,
  UNIQUE(did, target_type, target_id),
  FOREIGN KEY (did) REFERENCES users(did)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  subscriber_did TEXT NOT NULL,
  creator_did TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (subscriber_did, creator_did),
  FOREIGN KEY (subscriber_did) REFERENCES users(did),
  FOREIGN KEY (creator_did) REFERENCES users(did)
);

-- Friends table (Social)
CREATE TABLE IF NOT EXISTS friends (
  did1 TEXT NOT NULL,
  did2 TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted'
  requested_at INTEGER NOT NULL,
  accepted_at INTEGER,
  PRIMARY KEY (did1, did2),
  FOREIGN KEY (did1) REFERENCES users(did),
  FOREIGN KEY (did2) REFERENCES users(did)
);

-- Groups table (Social)
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_did TEXT NOT NULL,
  privacy TEXT DEFAULT 'public',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (creator_did) REFERENCES users(did)
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  did TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  role TEXT DEFAULT 'member', -- 'member', 'admin'
  PRIMARY KEY (group_id, did),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (did) REFERENCES users(did)
);

-- Marketplace items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id TEXT PRIMARY KEY,
  seller_did TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL,
  image_cids TEXT,
  location TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'reserved'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (seller_did) REFERENCES users(did)
);

-- Messages table (Messenger)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  group_id TEXT,
  content TEXT NOT NULL,
  encrypted INTEGER DEFAULT 0,
  nonce TEXT,
  created_at INTEGER NOT NULL,
  read INTEGER DEFAULT 0,
  FOREIGN KEY (from_did) REFERENCES users(did),
  FOREIGN KEY (to_did) REFERENCES users(did),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  type TEXT NOT NULL, -- 'donation', 'purchase', 'subscription'
  transaction_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (from_did) REFERENCES users(did),
  FOREIGN KEY (to_did) REFERENCES users(did)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  to_did TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (to_did) REFERENCES users(did)
);

-- IPFS content mapping
CREATE TABLE IF NOT EXISTS ipfs_content (
  cid TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (did) REFERENCES users(did)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_did ON videos(did);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_did ON posts(did);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_did);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON subscriptions(creator_did);
CREATE INDEX IF NOT EXISTS idx_messages_to_did ON messages(to_did);
CREATE INDEX IF NOT EXISTS idx_messages_from_did ON messages(from_did);
`;

export const SCHEMA_VERSION = 1;