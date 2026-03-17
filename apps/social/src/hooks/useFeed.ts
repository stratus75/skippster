import { useCallback } from 'react';
import { useFeedStore } from '../stores';

export function useFeed(did: string | null) {
  const {
    posts,
    isLoading,
    error,
    hasMore,
    fetchFeed,
    fetchPublic,
    createPost,
    likePost,
    unlikePost,
    reset,
  } = useFeedStore();

  const loadFeed = useCallback(async (reset = false) => {
    if (did) {
      await fetchFeed(did, reset);
    } else {
      await fetchPublic(reset);
    }
  }, [did, fetchFeed, fetchPublic]);

  const createNewPost = useCallback(async (content: string, videoId?: string) => {
    if (!did) throw new Error('User not authenticated');
    const post = await createPost({
      id: crypto.randomUUID(),
      did,
      content,
      videoId,
      privacy: 'public',
    });
    return post;
  }, [did, createPost]);

  const toggleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!did) throw new Error('User not authenticated');
    if (isLiked) {
      await unlikePost(postId, did);
    } else {
      await likePost(postId, did);
    }
  }, [did, likePost, unlikePost]);

  return {
    posts,
    isLoading,
    error,
    hasMore,
    loadFeed,
    createNewPost,
    toggleLike,
    reset,
  };
}