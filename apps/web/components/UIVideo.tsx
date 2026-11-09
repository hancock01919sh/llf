'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconPause, IconPlay } from './Icon';
export function UIVideo(
  props: React.VideoHTMLAttributes<HTMLVideoElement> & {
    pause?: boolean;
    lazyLoad?: boolean;
    className?: string;
  },
) {
  const { className, pause, lazyLoad, ...restProps } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(!video.paused);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  useEffect(() => {
    if (pause && videoRef.current) {
      videoRef.current.pause();
      handlePause();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [pause, handlePause]);

  function getTransitionClass(isPlaying: boolean, role: 'play' | 'pause') {
    const base =
      'absolute cursor-pointer will-change-transform left-4 bottom-3.5 transition-all duration-300';
    if (role === 'play') {
      return `${base} ${
        isPlaying
          ? 'opacity-100 rotate-0 scale-100'
          : 'opacity-0 rotate-90 scale-75 pointer-events-none'
      }`;
    }

    return `${base} ${
      isPlaying
        ? 'opacity-0 -rotate-90 scale-75 pointer-events-none'
        : 'opacity-100 rotate-0 scale-100'
    }`;
  }
  return (
    <div
      className={`relative overflow-hidden bg-ink-terra-15 ${className}`}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause video' : 'Play video'}
      onClick={togglePlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlay();
        }
      }}
    >
      {/* Decorative background video: muted, no audio track, so captions are not applicable. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover`}
        playsInline
        preload={lazyLoad ? 'metadata' : 'auto'}
        onPlay={handlePlay}
        onPause={handlePause}
        {...restProps}
      />
      <IconPlay aria-label="Play" className={getTransitionClass(isPlaying, 'play')} />
      <IconPause aria-label="Pause" className={getTransitionClass(isPlaying, 'pause')} />
    </div>
  );
}
