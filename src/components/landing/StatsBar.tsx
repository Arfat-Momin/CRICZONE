"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type StatItem = { label: string; value: number; suffix?: string };

const STATS: StatItem[] = [
  { label: "Tournaments Run", value: 42 },
  { label: "Players Auctioned", value: 1860 },
  { label: "Teams Built", value: 118 },
  { label: "Live Bid Events", value: 24000, suffix: "+" },
];

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, target]);

  return value;
}

function StatCell({ item, active }: { item: StatItem; active: boolean }) {
  const v = useCountUp(item.value, active);
  const display =
    item.suffix === "+" || item.value >= 1000
      ? v.toLocaleString("en-IN")
      : String(v);
  return (
    <div className="relative flex flex-col items-center px-3 py-6 text-center md:px-6 md:py-8">
      <p className="font-[family-name:var(--font-numeric)] text-3xl font-bold leading-none text-mint text-glow-mint md:text-5xl">
        {display}
        {item.suffix ? (
          <span className="text-lg md:text-2xl"> {item.suffix}</span>
        ) : null}
      </p>
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-cream/60 md:text-xs">
        {item.label}
      </p>
    </div>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section
      ref={ref}
      className="relative border-y border-mint/10 bg-[#0A1410]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(216,243,220,0.08),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 divide-x divide-mint/10 md:grid-cols-4">
          {STATS.map((s) => (
            <StatCell key={s.label} item={s} active={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}