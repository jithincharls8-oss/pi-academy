import { useEffect, useState } from 'react';

/**
 * The sandbox clock: real time, ticking every `tickMs` so live displays update. Pausing freezes
 * "now" so a learner can inspect a moment.
 */
export function useSimClock(tickMs = 5000): {
  now: number;
  paused: boolean;
  setPaused: (p: boolean) => void;
} {
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(t);
  }, [paused, tickMs]);
  return { now, paused, setPaused };
}
