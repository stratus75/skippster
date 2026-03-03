/**
 * Skippster Cross-App Integration
 * Connects Tube and Social apps
 */

import { IdentityManager } from './identity/src/manager';
import type { VideoMetadata, Post, MarketplaceItem, DID } from './shared-types';

/**
 * Cross-app integration manager
 */
export class CrossAppManager {
  private identity: IdentityManager;
  private tubeAPI: TubeAPIClient;
  private socialAPI: SocialAPIClient;

  constructor(identity: IdentityManager) {
    this.identity = identity;
    this.tubeAPI = new TubeAPIClient(identity);
    this.socialAPI = new SocialAPIClient(identity);
  }

  /**
   * Get unified profile for a user
   * Combines Tube channel and Social profile
   */
  async getUnifiedProfile(did: string): Promise<UnifiedProfile> {
    const [tubeProfile, socialProfile] = await Promise.all([
      this.tubeAPI.getChannel(did),
      this.socialAPI.getProfile(did),
    ]);

    return {
      did,
      handle: socialProfile?.handle || tubeProfile?.handle || '',
      name: socialProfile?.name || tubeProfile?.name || '',
      avatar: socialProfile?.avatar || tubeProfile?.thumbnail,
      bio: socialProfile?.bio || tubeProfile?.description,
      tubeChannel: tubeProfile,
      socialProfile: socialProfile,
      subscribers: (tubeProfile?.subscribers || 0) + (socialProfile?.followers || 0),
      joinedAt: tubeProfile?.createdAt || socialProfile?.joinedAt,
    };
  }

  /**
   * Cross-post a Tube video to Social feed
   */
  async crossPostVideo(
    videoId: string,
    message?: string,
    privacy?: 'public' | 'friends'
  ): Promise<Post> {
    const video = await this.tubeAPI.getVideo(videoId);

    const post = await this.socialAPI.createPost({
      did: this.identity.getDID(),
      content: message || `Just uploaded a new video: ${video.title}`,
      videoId,
      privacy: privacy || 'public',
    });

    return post;
  }

  /**
   * Embed a Tube video in a Social post
   */
  async createPostWithVideoEmbed(
    content: string,
    videoId: string,
    privacy?: 'public' | 'friends'
  ): Promise<Post> {
    return this.socialAPI.createPost({
      did: this.identity.getDID(),
      content,
      videoId,
      privacy: privacy || 'public',
    });
  }

  /**
   * Get unified feed combining Tube and Social content
   */
  async getUnifiedFeed(
    did: string,
    limit = 20
  ): Promise<UnifiedFeedItem[]> {
    const [tubeVideos, socialPosts] = await Promise.all([
      this.tubeAPI.getVideosByDID(did, limit / 2),
      this.socialAPI.getPostsByDID(did, limit / 2),
    ]);

    const feed: UnifiedFeedItem[] = [];

    // Add Tube videos as feed items
    for (const video of tubeVideos) {
      feed.push({
        type: 'tube_video',
        id: video.id,
        did: video.did,
        title: video.title,
        thumbnail: video.thumbnailCID,
        createdAt: video.createdAt,
        views: video.views,
        video,
      });
    }

    // Add Social posts
    for (const post of socialPosts) {
      feed.push({
        type: 'social_post',
        id: post.id,
        did: post.did,
        content: post.content,
        media: post.mediaCids,
        videoId: post.videoId,
        createdAt: post.createdAt,
        privacy: post.privacy,
        likes: post.reactions?.length || 0,
        comments: post.comments?.length || 0,
        post,
      });
    }

    // Sort by creation date
    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return feed.slice(0, limit);
  }

  /**
   * Share a marketplace item across both apps
   */
  async shareMarketplaceItem(
    item: MarketplaceItem,
    platform: 'tube' | 'social' | 'both' = 'both'
  ): Promise<void> {
    if (platform === 'tube' || platform === 'both') {
      await this.tubeAPI.announceMarketplaceItem(item);
    }

    if (platform === 'social' || platform === 'both') {
      await this.socialAPI.createPost({
        did: this.identity.getDID(),
        content: `Just listed a new item on the Skippster Marketplace: ${item.title}`,
        privacy: 'public',
      });
    }
  }

  /**
   * Sync contacts between Tube and Social
   */
  async syncContacts(): Promise<ContactSyncResult> {
    const tubeSubscriptions = await this.tubeAPI.getSubscriptions(this.identity.getDID());
    const socialFriends = await this.socialAPI.getFriends(this.identity.getDID());

    const synced: string[] = [];
    const toFollowOnTube: string[] = [];
    const toFriendOnSocial: string[] = [];

    // Find Social friends to follow on Tube
    for (const friend of socialFriends) {
      if (!tubeSubscriptions.some((s) => s.creatorDID === friend.did)) {
        toFollowOnTube.push(friend.did);
      }
    }

    // Find Tube subscriptions to friend on Social
    for (const sub of tubeSubscriptions) {
      if (!socialFriends.some((f) => f.did === sub.creatorDID)) {
        toFriendOnSocial.push(sub.creatorDID);
      }
    }

    return {
      synced,
      toFollowOnTube,
      toFriendOnSocial,
      totalTubeSubscriptions: tubeSubscriptions.length,
      totalSocialFriends: socialFriends.length,
    };
  }

  /**
   * Get shared contacts
   */
  async getSharedContacts(): Promise<SharedContact[]> {
    const [tubeSubs, socialFriends] = await Promise.all([
      this.tubeAPI.getSubscriptions(this.identity.getDID()),
      this.socialAPI.getFriends(this.identity.getDID()),
    ]);

    const sharedDIDs = new Set<string>();
    tubeSubs.forEach((s) => sharedDIDs.add(s.creatorDID));
    socialFriends.forEach((f) => sharedDIDs.add(f.did));

    const contacts: SharedContact[] = [];

    for (const did of sharedDIDs) {
      const isTubeSub = tubeSubs.some((s) => s.creatorDID === did);
      const isSocialFriend = socialFriends.some((f) => f.did === did);

      const profile = await this.getUnifiedProfile(did);

      contacts.push({
        did,
        profile,
        isTubeSubscriber: isTubeSub,
        isSocialFriend: isSocialFriend,
      });
    }

    return contacts;
  }

  /**
   * Send unified message (works across both apps)
   */
  async sendUnifiedMessage(toDID: string, content: string): Promise<string> {
    // Send through Social's messenger (since Social has full messaging)
    return this.socialAPI.sendMessage(this.identity.getDID(), toDID, content);
  }

  /**
   * Get unified notifications from both apps
   */
  async getUnifiedNotifications(limit = 20): Promise<UnifiedNotification[]> {
    const [tubeNotifs, socialNotifs] = await Promise.all([
      this.tubeAPI.getNotifications(this.identity.getDID(), limit),
      this.socialAPI.getNotifications(this.identity.getDID(), limit),
    ]);

    const unified: UnifiedNotification[] = [
      ...tubeNotifs.map((n) => ({ ...n, platform: 'tube' as const })),
      ...socialNotifs.map((n) => ({ ...n, platform: 'social' as const })),
    ];

    // Sort by date
    unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return unified.slice(0, limit);
  }
}

/**
 * Tube API client
 */
class TubeAPIClient {
  private identity: IdentityManager;
  private baseUrl = 'http://localhost:4000';

  constructor(identity: IdentityManager) {
    this.identity = identity;
  }

  async getVideo(videoId: string): Promise<VideoMetadata> {
    // In production, this would call the Tube API
    return {} as any;
  }

  async getVideosByDID(did: string, limit: number): Promise<VideoMetadata[]> {
    return [];
  }

  async getChannel(did: string): Promise<TubeChannelProfile | null> {
    return null;
  }

  async getSubscriptions(did: string): Promise<Array<{ creatorDID: string }>> {
    return [];
  }

  async getNotifications(did: string, limit: number): Promise<any[]> {
    return [];
  }

  async announceMarketplaceItem(item: MarketplaceItem): Promise<void> {
    // Announce item to P2P network
  }
}

/**
 * Social API client
 */
class SocialAPIClient {
  private identity: IdentityManager;
  private baseUrl = 'http://localhost:4000';

  constructor(identity: IdentityManager) {
    this.identity = identity;
  }

  async createPost(data: {
    did: string;
    content: string;
    videoId?: string;
    privacy?: 'public' | 'friends';
  }): Promise<Post> {
    // In production, this would call the Social API
    return {} as any;
  }

  async getPostsByDID(did: string, limit: number): Promise<Post[]> {
    return [];
  }

  async getProfile(did: string): Promise<SocialProfile | null> {
    return null;
  }

  async getFriends(did: string): Promise<Array<{ did: string }>> {
    return [];
  }

  async sendMessage(fromDID: string, toDID: string, content: string): Promise<string> {
    return '';
  }

  async getNotifications(did: string, limit: number): Promise<any[]> {
    return [];
  }
}

// Types
export interface UnifiedProfile {
  did: string;
  handle: string;
  name: string;
  avatar?: string;
  bio?: string;
  tubeChannel?: TubeChannelProfile;
  socialProfile?: SocialProfile;
  subscribers: number;
  joinedAt?: string;
}

export interface TubeChannelProfile {
  did: string;
  handle: string;
  name: string;
  description: string;
  thumbnail?: string;
  subscribers: number;
  createdAt: string;
}

export interface SocialProfile {
  did: string;
  handle: string;
  name: string;
  bio?: string;
  avatar?: string;
  followers: number;
  joinedAt: string;
}

export type UnifiedFeedItem =
  | {
      type: 'tube_video';
      id: string;
      did: string;
      title: string;
      thumbnail?: string;
      createdAt: string;
      views: number;
      video: VideoMetadata;
    }
  | {
      type: 'social_post';
      id: string;
      did: string;
      content: string;
      media?: string[];
      videoId?: string;
      createdAt: string;
      privacy: 'public' | 'friends';
      likes: number;
      comments: number;
      post: Post;
    };

export interface ContactSyncResult {
  synced: string[];
  toFollowOnTube: string[];
  toFriendOnSocial: string[];
  totalTubeSubscriptions: number;
  totalSocialFriends: number;
}

export interface SharedContact {
  did: string;
  profile: UnifiedProfile;
  isTubeSubscriber: boolean;
  isSocialFriend: boolean;
}

export interface UnifiedNotification {
  id: string;
  platform: 'tube' | 'social';
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}