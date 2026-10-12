"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Card Cascade shuffle for the live auction.
 *
 * STRICT 3s duration — the hard landing timer fires at exactly 3000ms
 * regardless of tick timing. The tick loop uses a separate safety check
 * so it never lands late.
 *
 * Timing envelope:
 *   0–1.6s   fast roll (65ms/tick)
 *   1.6–2.6s decelerate
 *   2.6–3.0s land (spring settle)
 */

const DURATION_MS = 3000;
const FAST_DELAY = 65;
const SLOW_AT = 1600;
const LAND_AT = 2600;

type Props = {
  target: string;
  names: string[];
  reduce: boolean;
};

export function CardCascadeShuffle({ target, names, reduce }: Props) {
  const namesKey = names.join("|");

  const pool = useMemo(() => {
    const filtered = names.filter((n) => n !== target);
    return filtered.length > 0 ? filtered : [target];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey, target]);

  const [display, setDisplay] = useState(target);
  const [tilt, setTilt] = useState(0);
  const [landed, setLanded] = useState(false);
  const [nonce, setNonce] = useState(0);

  const poolRef = useRef(pool);
  poolRef.current = pool;

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      setTilt(0);
      setLanded(true);
      setNonce((n) => n + 1);
      return;
    }

    setLanded(false);
    setTilt(0);
    setNonce((n) => n + 1);
    setDisplay(poolRef.current[0] ?? target);

    let active = true;
    let tickTimer: number | null = null;
    const start = Date.now();
    let i = 0;

    function tick() {
      if (!active) return;
      const elapsed = Date.now() - start;
      if (elapsed >= DURATION_MS) return;

      const pick = poolRef.current[i % poolRef.current.length] ?? target;
      setDisplay(pick);
      setTilt(Math.random() * 16 - 8);
      i++;

      let delay = FAST_DELAY;
      if (elapsed > SLOW_AT) {
        delay = 110 + (elapsed - SLOW_AT) * 0.16;
        if (elapsed > LAND_AT) delay = 240 + (elapsed - LAND_AT) * 0.32;
      }
      tickTimer = window.setTimeout(tick, delay);
    }

    tickTimer = window.setTimeout(tick, 60);

    // HARD LANDING — exactly 3000ms, no exceptions
    const landTimer = window.setTimeout(() => {
      active = false;
      if (tickTimer !== null) window.clearTimeout(tickTimer);
      setDisplay(target);
      setTilt(0);
      setLanded(true);
      setNonce((n) => n + 1);
    }, DURATION_MS);

    return () => {
      active = false;
      if (tickTimer !== null) window.clearTimeout(tickTimer);
      window.clearTimeout(landTimer);
    };
  }, [target, pool, reduce]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
      {/* Status pill */}
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] transition-all duration-500 ${
          landed
            ? "bg-mint text-forest shadow-[0_0_28px_-4px_rgba(216,243,220,0.85)]"
            : "bg-sold text-white shadow-[0_0_24px_-4px_rgba(193,18,31,0.85)]"
        }`}
      >
        {landed ? "On the Block" : "Dealing Card"}
      </span>

      {/* Cascade stage */}
      <div
        className="relative flex h-[200px] w-[300px] items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Shadow under the card */}
        <span
          aria-hidden
          className={`absolute bottom-2 left-1/2 h-3.5 -translate-x-1/2 rounded-full transition-all duration-500 ${
            landed
              ? "w-60 bg-[radial-gradient(ellipse,rgba(216,243,220,0.55),transparent_70%)] opacity-100"
              : "w-52 bg-[radial-gradient(ellipse,rgba(216,243,220,0.25),transparent_70%)] opacity-60"
          }`}
        />

        {/* The card */}
        <motion.div
          key={nonce}
          initial={false}
          animate={{
            rotate: landed ? 0 : tilt,
            scale: landed ? 1.08 : 0.95,
          }}
          transition={{
            duration: landed ? 0.4 : 0.18,
            ease: landed
              ? ([0.34, 1.56, 0.64, 1] as const)
              : ([0.16, 1, 0.3, 1] as const),
          }}
          className={`relative flex min-h-[120px] w-[260px] items-center justify-center rounded-[20px] border px-6 py-7 transition-all duration-500 ${
            landed
              ? "border-mint/60 bg-gradient-to-br from-[#0F231A]/90 to-[#050A08]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),0_0_60px_-15px_rgba(216,243,220,0.6)]"
              : "border-mint/20 bg-gradient-to-br from-[#0F231A]/85 to-[#050A08]/95 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)]"
          }`}
        >
          <p
            className={`break-words text-center font-[family-name:var(--font-display)] leading-tight transition-all duration-300 ${
              landed
                ? "text-3xl font-bold text-cream text-glow-mint"
                : "text-xl font-semibold text-cream/80"
            }`}
          >
            {display}
          </p>
        </motion.div>

        {/* Bloom burst on landing */}
        {landed && !reduce && (
          <motion.span
            key={`burst-${nonce}`}
            initial={{ scale: 0.6, opacity: 0.85 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/30"
          />
        )}
      </div>
    </div>
  );
}