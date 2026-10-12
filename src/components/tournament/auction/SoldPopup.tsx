"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";

/* ============================================================
   SOLD POPUP — compact + responsive
   Same cinematic sequence as before, everything scaled down.
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
    player.photo_url || "https://placehold.co/400x400/0A1410/D8F3DC?text=%3F";
  const teamInitial = (team.team_name[0] ?? "?").toUpperCase();
  const teamPhoto =
    team.photo_url ||
    `https://placehold.co/200x200/0A1410/D8F3DC?text=${encodeURIComponent(teamInitial)}`;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="sold-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.28 }}
        className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center overflow-hidden px-3 sm:px-4"
      >
        {/* Dark red-tinted backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0508]/95 via-[#0f0204]/95 to-[#050102]/95" />

        {/* Radial glow */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(216,243,220,0.55) 0%, rgba(193,18,31,0.35) 40%, transparent 70%)",
            }}
          />
        )}

        {/* White flash */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}

        {/* Confetti */}
        {!reduce && <Confetti />}

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-[92vw] flex-col items-center gap-2.5 text-center sm:max-w-md sm:gap-3 md:max-w-lg md:gap-4">
          <Stamp label="SOLD" variant="sold" reduce={!!reduce} />

          {/* Player */}
          <motion.div
            initial={reduce ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-mint/60 shadow-[0_0_30px_-8px_rgba(216,243,220,0.7)] sm:h-18 sm:w-18 md:h-20 md:w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerPhoto}
                alt={player.full_name}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <h2 className="line-clamp-2 max-w-[18rem] font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-cream sm:text-xl md:text-2xl lg:text-3xl">
              {player.full_name}
            </h2>
          </motion.div>

          {/* Team chip */}
          <motion.div
            initial={reduce ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-full border border-mint/30 bg-mint/5 px-3 py-1.5 sm:gap-2.5 sm:px-4 sm:py-2"
          >
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border-[1.5px] border-mint/60 sm:h-7 sm:w-7 md:h-8 md:w-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamPhoto}
                alt={team.team_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-[8px] font-extrabold uppercase tracking-[0.24em] text-mint/70 sm:text-[9px] md:text-[10px]">
                Bid By
              </p>
              <p className="line-clamp-1 max-w-[9rem] font-[family-name:var(--font-display)] text-xs font-bold text-cream sm:max-w-[11rem] sm:text-sm md:text-base">
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
            className="flex items-baseline gap-1.5"
          >
            <p className="font-[family-name:var(--font-numeric)] text-4xl font-bold leading-none text-mint sm:text-5xl md:text-6xl lg:text-7xl">
              {price}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-mint/70 sm:text-xs md:text-sm">
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
    player.photo_url || "https://placehold.co/400x400/0A1410/D8F3DC?text=%3F";

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="unsold-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.3 }}
        className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center overflow-hidden px-3 sm:px-4"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#101010]/95 via-[#080808]/95 to-[#020202]/95" />

        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute"
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(90,90,90,0.25) 50%, transparent 70%)",
            }}
          />
        )}

        <div className="relative z-10 flex w-full max-w-[92vw] flex-col items-center gap-2.5 text-center sm:max-w-sm sm:gap-3 md:max-w-md md:gap-4">
          <Stamp label="UNSOLD" variant="unsold" reduce={!!reduce} />

          <motion.div
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-12 w-12 overflow-hidden rounded-full border-[3px] border-white/20 shadow-xl grayscale sm:h-16 sm:w-16 md:h-20 md:w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerPhoto}
                alt={player.full_name}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <h2 className="line-clamp-2 max-w-[18rem] font-[family-name:var(--font-display)] text-base font-bold leading-tight text-white/90 sm:text-lg md:text-xl lg:text-2xl">
              {player.full_name}
            </h2>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50 sm:text-xs md:text-sm"
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
   STAMP — smaller, responsive
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
      initial={reduce ? false : { scale: 4.5, opacity: 0, rotate: -30 }}
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
      <div
        className="relative rounded-lg px-4 py-2 sm:rounded-xl sm:px-6 sm:py-2.5 md:px-8 md:py-3.5 lg:px-10 lg:py-4"
        style={{
          border: `3px double ${borderColor}`,
          boxShadow: sold
            ? "0 0 30px rgba(193,18,31,0.4), inset 0 0 15px rgba(0,0,0,0.35)"
            : "0 0 22px rgba(200,200,200,0.22), inset 0 0 15px rgba(0,0,0,0.35)",
          background: `radial-gradient(circle at center, ${color}dd 0%, ${color}aa 100%)`,
        }}
      >
        <p
          className="font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none tracking-[0.04em] sm:text-4xl md:text-5xl lg:text-6xl"
          style={{
            color: textColor,
            textShadow: "0 3px 0 rgba(0,0,0,0.25), 2px 2px 0 rgba(0,0,0,0.15)",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </p>
      </div>

      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ delay: 0.42, duration: 0.35 }}
          style={{ boxShadow: "0 0 50px rgba(255,255,255,0.6)" }}
        />
      )}
    </motion.div>
  );
}

/* ============================================================
   CONFETTI — same, smaller vertical range
   ============================================================ */

function Confetti() {
  const pieces = Array.from({ length: 20 });
  const colors = ["#C1121F", "#D8F3DC", "#2D6A4F", "#FDFCF0", "#FFA000"];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((_, i) => {
        const left = (i * 5.2) % 100;
        const color = colors[i % colors.length];
        const delay = 0.15 + (i % 6) * 0.06;
        const duration = 1.9 + (i % 4) * 0.25;
        const size = 5 + (i % 3) * 2;
        const drift = (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 20);
        return (
          <motion.span
            key={i}
            initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
            animate={{
              y: [-40, 400],
              x: [0, drift],
              opacity: [0, 1, 1, 0],
              rotate: [0, 360 + (i % 3) * 180],
            }}
            transition={{ duration, delay, ease: "easeOut" }}
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