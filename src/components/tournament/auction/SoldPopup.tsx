"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";

export function SoldPopup({
  player,
  team,
  price,
  onClose,
}: {
  player: Tables<"players">;
  team: Tables<"teams">;
  price: number;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F231A]/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-live="assertive"
    >
      <motion.div
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-sold/40 bg-gradient-to-b from-cream to-white p-8 text-center shadow-2xl"
      >
        {/* Confetti */}
        {!reduce && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ y: -40, opacity: 0, rotate: 0 }}
                animate={{ y: 340, opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{
                  duration: 1.6,
                  delay: 0.05 * i,
                  ease: "easeOut",
                }}
                className="absolute block h-2 w-2 rounded-sm"
                style={{
                  left: `${8 + i * 7}%`,
                  background:
                    i % 3 === 0
                      ? "#C1121F"
                      : i % 3 === 1
                        ? "#2D6A4F"
                        : "#D8F3DC",
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sold text-4xl font-bold text-white shadow-xl"
        >
          ✓
        </motion.div>

        <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold text-sold">
          SOLD!
        </h2>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          {player.full_name}
        </p>
        <p className="mt-1 text-sm text-[#1B4332]/70">
          to <span className="font-bold text-[#2D6A4F]">{team.team_name}</span>
        </p>
        <div className="mt-4 inline-block rounded-full bg-sold px-6 py-3 font-[family-name:var(--font-numeric)] text-3xl font-bold text-white shadow-lg">
          {price} pts
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 block w-full rounded-lg border border-[#1B4332]/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1B4332]/70 transition hover:bg-mint"
        >
          Dismiss
        </button>
      </motion.div>
    </div>
  );
}

export function UnsoldBanner({
  player,
  onClose,
}: {
  player: Tables<"players">;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F231A]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-live="assertive"
    >
      <motion.div
        initial={reduce ? false : { y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border-2 border-[#1B4332]/20 bg-white p-8 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1B4332]/10 text-3xl">
          🚫
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[#1B4332]/70">
          UNSOLD
        </h2>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-forest">
          {player.full_name}
        </p>
        <p className="mt-1 text-xs uppercase tracking-widest text-[#1B4332]/50">
          Will return to the pool
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-[#1B4332]/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1B4332]/70 transition hover:bg-mint"
        >
          Dismiss
        </button>
      </motion.div>
    </div>
  );
}