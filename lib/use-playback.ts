'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Play/pause state for a voice note. Plays `audioUrl` when there is one;
 * otherwise (samples, or no text-to-speech configured) runs a clock so the
 * waveform and "now roasting" still advance.
 */
export function usePlayback(durationSec: number, audioUrl?: string, startSec = 0) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(startSec);
  const elapsedRef = useRef(startSec);
  const audio = useRef<HTMLAudioElement | null>(null);

  const seek = useCallback((sec: number) => {
    elapsedRef.current = sec;
    setElapsed(sec);
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    const el = new Audio(audioUrl);
    el.currentTime = elapsedRef.current;
    const tick = () => seek(el.currentTime);
    const end = () => setPlaying(false);
    el.addEventListener('timeupdate', tick);
    el.addEventListener('ended', end);
    el.addEventListener('error', end);
    audio.current = el;
    return () => {
      el.pause();
      el.removeEventListener('timeupdate', tick);
      el.removeEventListener('ended', end);
      el.removeEventListener('error', end);
      audio.current = null;
    };
  }, [audioUrl, seek]);

  useEffect(() => {
    if (!playing || audioUrl) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const next = Math.min(durationSec, elapsedRef.current + (now - last) / 1000);
      last = now;
      seek(next);
      if (next >= durationSec) setPlaying(false);
      else frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, audioUrl, durationSec, seek]);

  const toggle = useCallback(() => {
    const next = !playing;
    if (next && elapsedRef.current >= durationSec) {
      seek(0);
      if (audio.current) audio.current.currentTime = 0;
    }
    if (audio.current) {
      if (next) audio.current.play().catch(() => setPlaying(false));
      else audio.current.pause();
    }
    setPlaying(next);
  }, [playing, durationSec, seek]);

  return { playing, elapsed, progress: Math.min(1, elapsed / durationSec), toggle };
}
