import { useCallback } from 'react';
import { useFriendStore } from '../stores';

export function useFriends(did: string | null) {
  const {
    friends,
    pendingRequests,
    sentRequests,
    friendCount,
    pendingRequestCount,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchCounts,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    reset,
  } = useFriendStore();

  const loadFriends = useCallback(async () => {
    if (!did) return;
    await fetchFriends(did);
  }, [did, fetchFriends]);

  const loadPendingRequests = useCallback(async () => {
    if (!did) return;
    await fetchPendingRequests(did);
  }, [did, fetchPendingRequests]);

  const loadSentRequests = useCallback(async () => {
    if (!did) return;
    await fetchSentRequests(did);
  }, [did, fetchSentRequests]);

  const loadCounts = useCallback(async () => {
    if (!did) return;
    await fetchCounts(did);
  }, [did, fetchCounts]);

  const sendFriendRequest = useCallback(async (toDid: string) => {
    if (!did) throw new Error('User not authenticated');
    await sendRequest(did, toDid);
  }, [did, sendRequest]);

  const acceptFriendRequest = useCallback(async (fromDid: string) => {
    if (!did) throw new Error('User not authenticated');
    await acceptRequest(fromDid, did);
    await fetchPendingRequests(did);
  }, [did, acceptRequest, fetchPendingRequests]);

  const declineFriendRequest = useCallback(async (fromDid: string) => {
    if (!did) throw new Error('User not authenticated');
    await declineRequest(fromDid, did);
  }, [did, declineRequest]);

  const removeFriendByDID = useCallback(async (friendDid: string) => {
    if (!did) throw new Error('User not authenticated');
    await removeFriend(did, friendDid);
  }, [did, removeFriend]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    friendCount,
    pendingRequestCount,
    isLoading,
    error,
    loadFriends,
    loadPendingRequests,
    loadSentRequests,
    loadCounts,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriendByDID,
    reset,
  };
}