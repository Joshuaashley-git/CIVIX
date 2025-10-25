import { Clock } from "lucide-react";
import { useGlobalCountdown } from "@/lib/CountdownContext";

const GlobalTimerBar = () => {
  const { formatted, isComplete } = useGlobalCountdown();

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-2 text-sm">
        <Clock className="w-4 h-4 text-accent" />
        <span className="tabular-nums font-medium">{formatted}</span>
        {isComplete && (
          <span className="ml-2 text-destructive">Session expired</span>
        )}
      </div>
    </div>
  );
};

export default GlobalTimerBar;
