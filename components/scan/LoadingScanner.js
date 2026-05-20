"use client";

import { useEffect, useState } from "react";
import {
  LOADING_MESSAGES,
  LOADING_MESSAGE_INTERVAL_MS,
} from "@/lib/constants/loading-messages";

export default function LoadingScanner() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mt-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:mt-10 sm:p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <div
          className="h-11 w-11 shrink-0 rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin"
          aria-hidden
        />
        <div>
          <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {LOADING_MESSAGES[messageIndex]}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            This usually takes 10–20 seconds
          </p>
        </div>
      </div>
      <div className="mt-5 flex gap-1.5" aria-hidden>
        {LOADING_MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i === messageIndex ? "bg-emerald-400" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
