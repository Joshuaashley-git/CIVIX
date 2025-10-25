import { createContext, useContext, ReactNode } from "react";
import useCountdown from "@/hooks/useCountdown";

export type CountdownContextValue = {
  secondsLeft: number;
  formatted: string;
  isComplete: boolean;
  reset: (nextSeconds?: number) => void;
  setSeconds: (n: number) => void;
};

const CountdownContext = createContext<CountdownContextValue | null>(null);

export const CountdownProvider = ({ children }: { children: ReactNode }) => {
  // Global 2-minute timer for the entire app
  const countdown = useCountdown(120);

  return (
    <CountdownContext.Provider value={countdown as CountdownContextValue}>
      {children}
    </CountdownContext.Provider>
  );
};

export const useGlobalCountdown = () => {
  const ctx = useContext(CountdownContext);
  if (!ctx) throw new Error("useGlobalCountdown must be used within CountdownProvider");
  return ctx;
};
