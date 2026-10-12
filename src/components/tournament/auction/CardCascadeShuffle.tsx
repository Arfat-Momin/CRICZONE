"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Card Cascade shuffle for the live auction.
 *
 * STRICT 3s duration — the hard landing timer fires at exactly 3000ms
 * regardless of tick timing.
 *
 * Fills its parent container (100% height/width). The card stage below
 * is responsive so the container height never changes when shuffle
 * ends and the player card appears.
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center sm:gap-4 sm:p-5">
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

      {/* Cascade stage — fluid, centred inside the fixed-height parent */}
      <div
        className="relative flex h-[130px] w-full max-w-[240px] items-center justify-center sm:h-[160px] sm:max-w-[280px] md:h-[180px] md:max-w-[300px] lg:h-[200px] lg:max-w-[340px]"
        style={{ perspective: "1000px" }}
      >
        {/* Shadow */}
        <span
          aria-hidden
          className={`absolute bottom-1 left-1/2 h-3 -translate-x-1/2 rounded-full transition-all duration-500 sm:bottom-2 sm:h-3.5 ${
            landed
              ? "w-44 bg-[radial-gradient(ellipse,rgba(216,243,220,0.55),transparent_70%)] opacity-100 sm:w-60"
              : "w-36 bg-[radial-gradient(ellipse,rgba(216,243,220,0.25),transparent_70%)] opacity-60 sm:w-52"
          }`}
        />

        {/* Card */}
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
          className={`relative flex min-h-[80px] w-[180px] items-center justify-center rounded-2xl border px-4 py-5 transition-all duration-500 sm:min-h-[100px] sm:w-[220px] sm:px-6 sm:py-6 md:w-[260px] md:py-7 lg:w-[300px] lg:py-8 ${
            landed
              ? "border-mint/60 bg-gradient-to-br from-[#0F231A]/90 to-[#050A08]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),0_0_60px_-15px_rgba(216,243,220,0.6)]"
              : "border-mint/20 bg-gradient-to-br from-[#0F231A]/85 to-[#050A08]/95 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)]"
          }`}
        >
          <p
            className={`line-clamp-2 break-words text-center font-[family-name:var(--font-display)] leading-tight transition-all duration-300 ${
              landed
                ? "text-xl font-bold text-cream text-glow-mint sm:text-2xl md:text-3xl lg:text-4xl"
                : "text-base font-semibold text-cream/80 sm:text-lg md:text-xl lg:text-2xl"
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
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/30 sm:h-44 sm:w-44"
          />
        )}
      </div>
    </div>
  );
}