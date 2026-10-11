"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { BorderTrail } from "@/components/ui/border-trail";

type Props = {
  open: boolean;
  onClose: () => void;
  state: Tables<"auction_state"> | null;
  onBlockPlayer: Tables<"players"> | null;
  currentHighestTeam: Tables<"teams"> | null;
  tournamentName: string;
};

const TRAIL_GLOW: React.CSSProperties = {
  boxShadow:
    "0 0 40px 12px rgba(255, 201, 60, 0.55), 0 0 80px 30px rgba(255, 77, 109, 0.28)",
};

const BOX_BASE =
  "relative overflow-hidden rounded-3xl border border-[#FFC93C]/25 bg-[#131A33]/85 shadow-2xl";

export function ProjectionMode({
  open,
  onClose,
  state,
  onBlockPlayer,
  currentHighestTeam,
  tournamentName,
}: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onFsChange() {
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const currentBid = state?.current_bid_price ?? 0;
  const displayBid =
    currentBid > 0 ? currentBid.toFixed(1).replace(/\.0$/, "") : "—";
  const shuffling = state?.shuffling_name;

  const playerPhoto =
    onBlockPlayer?.photo_url ||
    "https://placehold.co/400x400/131A33/FFC93C?text=%3F";

  const teamInitial = currentHighestTeam?.team_name?.[0]?.toUpperCase() ?? "?";
  const teamPhoto =
    currentHighestTeam?.photo_url ||
    `https://placehold.co/200x200/131A33/FFC93C?text=${encodeURIComponent(teamInitial)}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="projection"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[75] flex flex-col bg-gradient-to-br from-[#0B1020] via-[#131A33] to-[#050A08] text-[#F0F4FF]"
          role="dialog"
          aria-modal="true"
          aria-label="Live projection board"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, rgba(255,201,60,0.14), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,77,109,0.16), transparent 50%)",
            }}
          />

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="chip-live inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] md:text-xs">
                <span className="cz-pulse-dot inline-block h-2 w-2 rounded-full bg-white" />
                Live
              </span>
              <span className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-[#F0F4FF]/70 md:text-base">
                {tournamentName}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-[#F0F4FF]/20 bg-[#F0F4FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F0F4FF]/80 transition hover:bg-[#F0F4FF]/20 md:text-xs"
              aria-label="Exit projection"
            >
              Exit (Esc)
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-6 md:px-8 md:pb-10">
            {shuffling ? (
              <ShufflingBox name={shuffling} reduce={!!reduce} />
            ) : onBlockPlayer ? (
              <div className="grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr] md:gap-6 lg:gap-8">
                {/* LEFT — Player */}
                <div className={BOX_BASE + " flex flex-col"}>
                  <BorderTrail size={150} style={TRAIL_GLOW} />
                  <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center md:gap-6 md:py-12">
                    <span className="chip-gold rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.32em] md:text-xs">
                      On the Block
                    </span>
                    <div className="h-40 w-40 overflow-hidden rounded-3xl border-4 border-[#FFC93C]/50 shadow-2xl md:h-56 md:w-56 lg:h-64 lg:w-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={playerPhoto}
                        alt={onBlockPlayer.full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-[#F0F4FF] md:text-6xl lg:text-7xl">
                      {onBlockPlayer.full_name}
                    </h1>
                    {(onBlockPlayer.category ||
                      onBlockPlayer.jersey_no != null) && (
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#FFC93C]/80 md:text-lg">
                        {[onBlockPlayer.category,
                          onBlockPlayer.jersey_no != null
                            ? `#${onBlockPlayer.jersey_no}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT — Bid + Team */}
                <div className="grid grid-rows-2 gap-4 md:gap-6 lg:gap-8">
                  {/* Current Bid */}
                  <div className={BOX_BASE + " flex flex-col"}>
                    <BorderTrail size={110} delay={0.2} style={TRAIL_GLOW} />
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-[#FFC93C] md:text-sm">
                        Current Bid
                      </span>
                      <motion.p
                        key={currentBid}
                        initial={reduce ? false : { scale: 1.15, opacity: 0.85 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 22,
                        }}
                        className="mt-2 font-[family-name:var(--font-numeric)] text-6xl font-bold leading-none text-led-gold md:text-7xl lg:text-8xl"
                      >
                        {displayBid}
                      </motion.p>
                      {state?.bid_mode === "star" && (
                        <span className="mt-3 chip-gold rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">
                          ★ Star Mode
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Leading Team */}
                  <div className={BOX_BASE + " flex flex-col"}>
                    <BorderTrail size={110} delay={0.4} style={TRAIL_GLOW} />
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-[#FFC93C] md:text-sm">
                        {currentBid > 0 ? "Bid By" : "Waiting For"}
                      </span>
                      {currentHighestTeam ? (
                        <>
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#FFC93C]/50 bg-[#0B1020] md:h-20 md:w-20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={teamPhoto}
                              alt={currentHighestTeam.team_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <motion.p
                            key={currentHighestTeam.id}
                            initial={reduce ? false : { y: 8, opacity: 0.6 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-full truncate font-[family-name:var(--font-display)] text-3xl font-bold text-[#F0F4FF] md:text-4xl lg:text-5xl"
                          >
                            {currentHighestTeam.team_name}
                          </motion.p>
                          {currentHighestTeam.captain_name && (
                            <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-[#F0F4FF]/45 md:text-xs">
                              {currentHighestTeam.captain_name}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F0F4FF]/15 bg-[#0B1020] text-2xl text-[#FFC93C]/50 md:h-20 md:w-20 md:text-3xl">
                            ?
                          </div>
                          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#F0F4FF]/60 md:text-3xl">
                            No bids yet
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <WaitingBox reduce={!!reduce} />
            )}
          </div>

          <p className="relative z-10 pb-4 text-center text-[10px] uppercase tracking-[0.3em] text-[#F0F4FF]/30 md:pb-6 md:text-xs">
            Press Esc to exit · CRICZONE
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ShufflingBox({ name, reduce }: { name: string; reduce: boolean }) {
  return (
    <div className={BOX_BASE + " w-full max-w-4xl"}>
      <BorderTrail size={150} style={TRAIL_GLOW} />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center md:py-24">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-[#FFC93C] md:text-sm">
          Selecting Player
        </p>
        <motion.h1
          key={name}
          initial={reduce ? false : { opacity: 0.4, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-[family-name:var(--font-display)] text-5xl font-bold text-[#F0F4FF] md:text-8xl"
        >
          {name}
        </motion.h1>
        <div className="mt-2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              className="h-3 w-3 rounded-full bg-[#FF4D6D]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitingBox({ reduce }: { reduce: boolean }) {
  return (
    <div className={BOX_BASE + " w-full max-w-4xl"}>
      <BorderTrail size={150} style={TRAIL_GLOW} />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-16 text-center md:py-24">
        <motion.p
          animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl md:text-7xl"
          aria-hidden
        >
          🏏
        </motion.p>
        <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#F0F4FF] md:text-5xl">
          Awaiting next player
        </p>
        <p className="text-base text-[#FFC93C]/60 md:text-lg">
          The auctioneer will draw the next name shortly.
        </p>
      </div>
    </div>
  );
}