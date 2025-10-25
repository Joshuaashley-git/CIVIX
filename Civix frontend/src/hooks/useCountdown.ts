import { useEffect, useRef, useState } from "react";

export type CountdownOptions = {
  onComplete?: () => void;
  intervalMs?: number; // default 1000ms
};

export default function useCountdown(initialSeconds: number, options: CountdownOptions = {}) {
  const { onComplete, intervalMs = 1000 } = options;
  const [secondsLeft, setSecondsLeft] = useState<number>(Math.max(0, Math.floor(initialSeconds)));
  const initialRef = useRef(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onComplete?.();
      return; // stop ticking when complete
    }

    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, intervalMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, intervalMs]);

  const reset = (nextSeconds?: number) => {
    setSecondsLeft(Math.max(0, Math.floor(nextSeconds ?? initialRef.current)));
  };

  const setSeconds = (nextSeconds: number) => {
    setSecondsLeft(Math.max(0, Math.floor(nextSeconds)));
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    secondsLeft,
    formatted,
    isComplete: secondsLeft <= 0,
    reset,
    setSeconds,
  } as const;
}
