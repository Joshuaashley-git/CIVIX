import { useEffect, useState } from 'react';
import { AlertCircle } from "lucide-react";

const VOTING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

interface GlobalTimerProps {
  onTimerEnd: () => void;
  startTime?: string | null;
}

export const GlobalTimer = ({ onTimerEnd, startTime }: GlobalTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(VOTING_DURATION);

  useEffect(() => {
    if (!startTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const elapsed = now - start;
      const remaining = Math.max(0, VOTING_DURATION - elapsed);
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onTimerEnd();
      }
    };

    // Calculate initial time left
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime, onTimerEnd]);

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!startTime) return null;

  return (
    <div className="fixed top-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
        <span className="font-mono font-bold text-lg">
          {formatTime(timeLeft)}
        </span>
      </div>
      {timeLeft < 30000 && (
        <div className="mt-2 flex items-start gap-2 text-yellow-600 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Hurry! Voting ends soon</span>
        </div>
      )}
    </div>
  );
};
