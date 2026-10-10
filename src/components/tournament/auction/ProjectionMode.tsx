"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  state: Tables<"auction_state"> | null;
  onBlockPlayer: Tables<"players"> | null;
  currentHighestTeam: Tables<"teams"> | null;
  tournamentName: string;
};

/**
 * Fullscreen projection board for venue screens.
 *
 * Shows only: player on block, current bid, and the team that leads.
 * All SOLD / UNSOLD popups still layer on top (z-[80] > z-[75]).
 */
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

  // Escape + fullscreen-change → close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onFsChange() {
      // If the browser exits fullscreen (Esc on some OSes), close projection
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const currentBid = state?.current_bid_price ?? 0;
  const displayBid =
    currentBid > 0 ? currentBid.toFixed(1).replace(/\.0$/, "") : "—";
  const shuffling = state?.shuffling_name;

  const photo =
    onBlockPlayer?.photo_url ||
    "https://placehold.co/400x400/1B4332/FDFCF0?text=%3F";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="projection"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[75] flex flex-col bg-gradient-to-br from-[#0F231A] via-[#1B4332] to-[#0A1810] text-cream"
          role="dialog"
          aria-modal="true"
          aria-label="Live projection board"
        >
          {/* Ambient glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 30%, rgba(216,243,220,0.15), transparent 45%), radial-gradient(circle at 80% 70%, rgba(45,106,79,0.28), transparent 50%)",
            }}
          />

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-sold px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white md:text-xs">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
              <span className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-cream/70 md:text-base">
                {tournamentName}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-cream/20 bg-cream/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cream/80 backdrop-blur transition hover:bg-cream/20 md:text-xs"
              aria-label="Exit projection"
            >
              Exit (Esc)
            </button>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-12 md:gap-12 md:px-10">
            {shuffling ? (
              <ShufflingView name={shuffling} />
            ) : onBlockPlayer ? (
              <>
                {/* Player row */}
                <div className="flex flex-col items-center gap-5 text-center md:flex-row md:gap-8 md:text-left">
                  <div className="h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-mint/40 shadow-2xl md:h-44 md:w-44 lg:h-52 lg:w-52">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={onBlockPlayer.full_name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-mint/70 md:text-sm">
                      On the Block
                    </p>
                    <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-cream md:text-6xl lg:text-7xl">
                      {onBlockPlayer.full_name}
                    </h1>
                    {(onBlockPlayer.category || onBlockPlayer.jersey_no != null) && (
                      <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-mint/80 md:text-lg">
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

                {/* Bid row */}
                <div className="flex w-full max-w-6xl flex-col items-center gap-8 md:flex-row md:items-stretch md:justify-center md:gap-16">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-mint/70 md:text-sm">
                      Current Bid
                    </p>
                    <motion.p
                      key={currentBid}
                      initial={reduce ? false : { scale: 1.12, opacity: 0.85 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="mt-2 font-[family-name:var(--font-numeric)] text-7xl font-bold leading-none text-cream md:text-[10rem] lg:text-[12rem]"
                    >
                      {displayBid}
                    </motion.p>
                    {state?.bid_mode === "star" && (
                      <span className="mt-3 rounded-full bg-[#7B1FA2] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white md:text-xs">
                        ★ Star Mode
                      </span>
                    )}
                  </div>

                  <div className="flex max-w-full flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-mint/70 md:text-sm">
                      {currentBid > 0 ? "Bid By" : "Waiting For"}
                    </p>
                    <motion.p
                      key={currentHighestTeam?.id ?? "none"}
                      initial={reduce ? false : { y: 8, opacity: 0.6 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className="mt-2 max-w-full truncate font-[family-name:var(--font-display)] text-4xl font-bold text-mint md:text-6xl lg:text-7xl"
                    >
                      {currentHighestTeam?.team_name ?? "No bids yet"}
                    </motion.p>
                  </div>
                </div>
              </>
            ) : (
              <WaitingView />
            )}
          </div>

          {/* Bottom hint */}
          <p className="relative z-10 pb-4 text-center text-[10px] uppercase tracking-[0.3em] text-cream/30 md:pb-6 md:text-xs">
            Press Esc to exit · CRICZONE
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ShufflingView({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-mint/70 md:text-sm">
        Selecting Player
      </p>
      <motion.h1
        key={name}
        initial={{ opacity: 0.4, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="font-[family-name:var(--font-display)] text-5xl font-bold text-cream md:text-8xl"
      >
        {name}
      </motion.h1>
      <div className="mt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            className="h-3 w-3 rounded-full bg-sold"
          />
        ))}
      </div>
    </div>
  );
}

function WaitingView() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-6xl md:text-7xl" aria-hidden>
        🏏
      </p>
      <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-cream md:text-5xl">
        Awaiting next player
      </p>
      <p className="text-base text-mint/60 md:text-lg">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}