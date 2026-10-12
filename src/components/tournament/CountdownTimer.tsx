"use client";

import { useEffect, useState } from "react";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function diff(targetMs: number): Parts {
  const ms = targetMs - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}

export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(diff(target));
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (parts === null) {
    return (
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <Unit value={null} label="Days" />
        <Unit value={null} label="Hours" />
        <Unit value={null} label="Mins" />
        <Unit value={null} label="Secs" />
      </div>
    );
  }

  if (parts.done) {
    return (
      <p className="text-sm font-semibold text-mint sm:text-base">
        Auction will start soon — please wait.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      <Unit value={parts.days} label="Days" />
      <Unit value={parts.hours} label="Hours" />
      <Unit value={parts.minutes} label="Mins" />
      <Unit value={parts.seconds} label="Secs" />
    </div>
  );
}

function Unit({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="min-w-[58px] rounded-xl border border-mint/12 bg-[#0A1410] px-2 py-2 text-center shadow-[0_0_25px_-12px_rgba(216,243,220,0.35)] sm:min-w-[72px] sm:px-3 sm:py-3">
      <span className="block font-[family-name:var(--font-numeric)] text-xl font-bold tabular-nums text-mint sm:text-2xl md:text-3xl">
        {value === null ? "--" : String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.18em] text-cream/45 sm:mt-1 sm:text-[10px] sm:tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}