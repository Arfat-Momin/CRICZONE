"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";

/* ============================================================
   SOLD POPUP
   ============================================================ */

type SoldProps = {
  player: Tables<"players">;
  team: Tables<"teams">;
  price: number;
  onClose: () => void;
};

export function SoldPopup({ player, team, price, onClose }: SoldProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLockScrollAndEscape(true, onClose);

  if (!mounted) return null;

  const playerPhoto =
    player.photo_url || "https://placehold.co/400x400/1B4332/FDFCF0?text=%3F";
  const teamInitial = (team.team_name[0] ?? "?").toUpperCase();
  const teamPhoto =
    team.photo_url ||
    `https://placehold.co/200x200/1B4332/FDFCF0?text=${encodeURIComponent(teamInitial)}`;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="sold-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.28 }}
        className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center overflow-hidden"
      >
        {/* Dark red-tinted backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a0510]/95 via-[#1a0308]/95 to-[#0a0204]/95" />

        {/* Radial glow that pulses on impact */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(216,243,220,0.55) 0%, rgba(193,18,31,0.35) 40%, transparent 70%)",
            }}
          />
        )}

        {/* White flash frame 1 */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}

        {/* Confetti (sold only) */}
        {!reduce && <Confetti />}

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 px-6 text-center md:gap-6">
          {/* Stamp */}
          <Stamp label="SOLD" variant="sold" reduce={!!reduce} />

          {/* Player */}
          <motion.div
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-mint/60 shadow-2xl md:h-32 md:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerPhoto}
                alt={player.full_name}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-cream md:text-5xl lg:text-6xl">
              {player.full_name}
            </h2>
          </motion.div>

          {/* Team chip */}
          <motion.div
            initial={reduce ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 rounded-full border border-mint/30 bg-white/10 px-5 py-2.5 backdrop-blur md:gap-4 md:px-6 md:py-3"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-mint/60 md:h-12 md:w-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamPhoto}
                alt={team.team_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-mint/70 md:text-xs">
                Bid By
              </p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-cream md:text-xl">
                {team.team_name}
              </p>
            </div>
          </motion.div>

          {/* Price */}
          <motion.div
            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1.05,
              type: "spring",
              stiffness: 240,
              damping: 16,
            }}
            className="flex items-baseline gap-2"
          >
            <p className="font-[family-name:var(--font-numeric)] text-7xl font-bold leading-none text-mint md:text-9xl">
              {price}
            </p>
            <p className="text-lg font-extrabold uppercase tracking-widest text-mint/70 md:text-2xl">
              pts
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/* ============================================================
   UNSOLD BANNER
   ============================================================ */

type UnsoldProps = {
  player: Tables<"players">;
  onClose: () => void;
};

export function UnsoldBanner({ player, onClose }: UnsoldProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLockScrollAndEscape(true, onClose);

  if (!mounted) return null;

  const playerPhoto =
    player.photo_url || "https://placehold.co/400x400/1B4332/FDFCF0?text=%3F";

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="unsold-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.3 }}
        className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center overflow-hidden"
      >
        {/* Muted gray backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/95 via-[#0e0e0e]/95 to-[#050505]/95" />

        {/* Slow gray ripple */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute"
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(90,90,90,0.25) 50%, transparent 70%)",
            }}
          />
        )}

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-4 px-6 text-center md:gap-6">
          <Stamp label="UNSOLD" variant="unsold" reduce={!!reduce} />

          <motion.div
            initial={reduce ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/20 shadow-xl grayscale md:h-24 md:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerPhoto}
                alt={player.full_name}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-white/90 md:text-5xl">
              {player.full_name}
            </h2>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-[0.35em] text-white/50 md:text-base"
          >
            Returns to Pool
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/* ============================================================
   STAMP
   ============================================================ */

function Stamp({
  label,
  variant,
  reduce,
}: {
  label: string;
  variant: "sold" | "unsold";
  reduce: boolean;
}) {
  const sold = variant === "sold";
  const color = sold ? "#C1121F" : "#4a4a4a";
  const borderColor = sold ? "rgba(255,235,205,0.85)" : "rgba(220,220,220,0.55)";
  const textColor = sold ? "#FFEBCD" : "#e8e8e8";

  return (
    <motion.div
      initial={
        reduce
          ? false
          : { scale: 4.5, opacity: 0, rotate: -30 }
      }
      animate={
        reduce
          ? undefined
          : {
              scale: [4.5, 1.05, 0.95, 1],
              opacity: 1,
              rotate: [-30, -12, -15, -14],
            }
      }
      transition={{
        duration: 0.55,
        times: [0, 0.55, 0.78, 1],
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative select-none"
      style={{ rotate: reduce ? "-14deg" : undefined }}
    >
      {/* Distressed stamp frame */}
      <div
        className="relative rounded-2xl px-8 py-4 md:px-14 md:py-7"
        style={{
          border: `5px double ${borderColor}`,
          boxShadow: `0 0 40px ${sold ? "rgba(255,235,205,0.4)" : "rgba(200,200,200,0.25)"}, inset 0 0 30px rgba(0,0,0,0.35)`,
          background: `radial-gradient(circle at center, ${color}dd 0%, ${color}aa 100%)`,
        }}
      >
        <p
          className="font-[family-name:var(--font-display)] text-6xl font-black uppercase leading-none tracking-[0.05em] md:text-8xl lg:text-9xl"
          style={{
            color: textColor,
            textShadow:
              "0 4px 0 rgba(0,0,0,0.25), 2px 2px 0 rgba(0,0,0,0.15)",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </p>
      </div>

      {/* Tiny impact shake after landing */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ delay: 0.42, duration: 0.35 }}
          style={{ boxShadow: "0 0 80px rgba(255,255,255,0.6)" }}
        />
      )}
    </motion.div>
  );
}

/* ============================================================
   CONFETTI (sold only, GPU-friendly)
   ============================================================ */

function Confetti() {
  const pieces = Array.from({ length: 24 });
  const colors = ["#C1121F", "#D8F3DC", "#2D6A4F", "#FDFCF0", "#FFA000"];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((_, i) => {
        const left = (i * 4.3) % 100;
        const color = colors[i % colors.length];
        const delay = 0.15 + (i % 6) * 0.06;
        const duration = 1.9 + (i % 4) * 0.25;
        const size = 6 + (i % 3) * 3;
        const drift = (i % 2 === 0 ? 1 : -1) * (30 + (i % 4) * 25);
        return (
          <motion.span
            key={i}
            initial={{
              y: -60,
              x: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              y: [ -60, 520 ],
              x: [0, drift],
              opacity: [0, 1, 1, 0],
              rotate: [0, 360 + (i % 3) * 180],
            }}
            transition={{
              duration,
              delay,
              ease: "easeOut",
            }}
            className="absolute block"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 2,
              background: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

/* ============================================================
   HOOKS
   ============================================================ */

function useLockScrollAndEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, onClose]);
}