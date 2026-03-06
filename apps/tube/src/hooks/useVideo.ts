import { useEffect, useRef } from 'react';
import { useVideoStore } from '../stores';

export function useVideo(videoId: string | undefined) {
  const { currentVideo, isLoading, error, playerState, fetchVideo, incrementViews, updatePlayerState, reset } = useVideoStore();
  const viewIncrementedRef = useRef(false);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (videoId) {
      viewIncrementedRef.current = false;
      fetchVideo(videoId);
    }
    return () => {
      reset();
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [videoId, fetchVideo, reset]);

  useEffect(() => {
    if (playerState.isReady && currentVideo && !viewIncrementedRef.current) {
      viewTimerRef.current = setTimeout(() => {
        incrementViews(currentVideo.id);
        viewIncrementedRef.current = true;
      }, 5000);
    }
    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [playerState.isReady, currentVideo, incrementViews]);

  return {
    video: currentVideo,
    isLoading,
    error,
    playerState,
    updatePlayerState,
  };
}