import { useEffect, useRef } from "react";

/** Schedules timeouts and clears them when the owning component unmounts. */
export const useTimeouts = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  return (callback: () => void, delay: number) => {
    timers.current.push(window.setTimeout(callback, delay));
  };
};
