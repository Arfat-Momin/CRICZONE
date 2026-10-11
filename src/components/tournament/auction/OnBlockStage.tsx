"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

type Props = {
  state: Tables<"auction_state"> | null;
  onBlockPlayer: Tables<"players"> | null;
  currentHighestTeam: Tables<"teams"> | null;
  players: Tables<"players">[];
};

export function OnBlockStage({
  state,
  onBlockPlayer,
  currentHighestTeam,
  players,
}: Props) {
  const reduce = useReducedMotion();
  const [shuffling, setShuffling] = useState<string | null>(null);

  useEffect(() => {
    if (state?.shuffling_name && state.shuffling_name !== shuffling) {
      setShuffling(state.shuffling_name);
    } else if (!state?.shuffling_name && state?.current_player_id) {
      setShuffling(null);
    } else if (!state?.shuffling_name && !state?.current_player_id) {
      setShuffling(null);
    }
  }, [state?.shuffling_name, state?.current_player_id, shuffling]);

  const rollPool = useMemo(() => {
    const names = players
      .filter((p) => p.status === "pending" || p.status === "unsold")
      .map((p) => p.full_name)
      .filter((n) => n !== shuffling);
    return names.length > 0 ? names : ["…", "…", "…"];
  }, [players, shuffling]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-6">
      {/* ============ LEFT — ON THE BLOCK ============ */}
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl card-navy-elevated dot-grid">
        {shuffling ? (
          <ShuffleRoll target={shuffling} names={rollPool} reduce={!!reduce} />
        ) : onBlockPlayer ? (
          <PlayerBlockCard player={onBlockPlayer} />
        ) : (
          <EmptyStage reduce={!!reduce} />
        )}
      </div>

      {/* ============ RIGHT — CURRENT BID ============ */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#FFC93C]/25 bg-gradient-to-br from-[#1B2340] via-[#131A33] to-[#0B1020] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_50px_-20px_rgba(255,201,60,0.25)]">
        {/* Corner LED dots */}
        <div className="pointer-events-none absolute right-4 top-4 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-[#FFC93C]/40"
              style={{ opacity: 0.25 + i * 0.2 }}
            />
          ))}
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-[#FFC93C]">
            Current Bid
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#F0F4FF]/35">
            Live · Instant
          </p>
        </div>

        <BidNumber
          value={state?.current_bid_price ?? 0}
          teamName={currentHighestTeam?.team_name ?? null}
          teamPhoto={currentHighestTeam?.photo_url ?? null}
          mode={state?.bid_mode ?? "normal"}
        />

        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em]">
          <span className="text-[#F0F4FF]/35">Bid mode</span>
          <span
            className={
              state?.bid_mode === "star"
                ? "chip-gold rounded-full px-2 py-0.5"
                : "rounded-full border border-[#F0F4FF]/20 px-2 py-0.5 text-[#F0F4FF]/60"
            }
          >
            {state?.bid_mode === "star" ? "★ Star ×1000" : "Normal"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BID NUMBER (LED style)
   ============================================================ */
function BidNumber({
  value,
  teamName,
  teamPhoto,
  mode,
}: {
  value: number;
  teamName: string | null;
  teamPhoto: string | null;
  mode: "normal" | "star";
}) {
  const reduce = useReducedMotion();
  const display = value > 0 ? value.toFixed(1).replace(/\.0$/, "") : "—";
  const initial = teamName?.[0]?.toUpperCase() ?? "?";

  return (
    <motion.div
      key={`${value}-${teamName ?? ""}`}
      initial={reduce ? false : { scale: 0.92, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      className="my-4 text-center"
    >
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-[family-name:var(--font-numeric)] text-[5.5rem] font-bold leading-none text-led-gold md:text-[7rem]">
          {display}
        </span>
        <span className="text-sm font-extrabold uppercase tracking-[0.28em] text-[#FFC93C]/60 md:text-base">
          pts
        </span>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {teamName ? (
          <>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#FFC93C]/45 bg-[#0B1020]">
              {teamPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#FFC93C]">
                  {initial}
                </div>
              )}
            </div>
            <span className="max-w-[16rem] truncate font-[family-name:var(--font-display)] text-xl font-bold text-[#F0F4FF] md:text-2xl">
              {teamName}
            </span>
          </>
        ) : (
          <span className="rounded-full border border-[#F0F4FF]/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.28em] text-[#F0F4FF]/45">
            No bids yet
          </span>
        )}
      </div>
      {mode === "star" && (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#FFC93C]/55">
          Star mode · increments of 1000
        </p>
      )}
    </motion.div>
  );
}

/* ============================================================
   PLAYER BLOCK CARD
   ============================================================ */
function PlayerBlockCard({ player }: { player: Tables<"players"> }) {
  const photo =
    player.photo_url || "https://placehold.co/400x400/131A33/FFC93C?text=%3F";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
    >
      {/* LOT chip */}
      <span className="chip-gold absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] sm:left-7 sm:top-7">
        ⚡ On the Block
      </span>

      {/* Photo */}
      <div className="mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[#FFC93C]/45 shadow-[0_0_45px_-12px_rgba(255,201,60,0.55)] sm:mx-0 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="eager"
          className="h-full w-full object-cover object-top"
        />
      </div>

      {/* Meta */}
      <div className="min-w-0 flex-1 text-center sm:pt-8 sm:text-left">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[#F0F4FF] sm:text-4xl lg:text-5xl">
          {player.full_name}
        </h2>

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {player.category && (
            <Pill label="Role" value={player.category} tone="gold" />
          )}
          {player.jersey_no != null && (
            <Pill label="Jersey" value={`#${player.jersey_no}`} tone="cyan" />
          )}
          {player.jersey_size && (
            <Pill label="Size" value={player.jersey_size} />
          )}
          {player.current_team && (
            <Pill label="From" value={player.current_team} />
          )}
        </div>

        {player.base_price != null && (
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#F0F4FF]/40">
            Base price ·{" "}
            <span className="text-[#FFC93C]/85">{player.base_price} pts</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold" | "cyan";
}) {
  const toneCls =
    tone === "gold"
      ? "border-[#FFC93C]/30 text-[#FFC93C]"
      : tone === "cyan"
        ? "border-[#00D9FF]/30 text-[#00D9FF]"
        : "border-[#F0F4FF]/15 text-[#F0F4FF]/85";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border bg-[#0B1020] px-2.5 py-1 text-xs ${toneCls}`}
    >
      <span className="font-bold uppercase tracking-[0.18em] text-[#F0F4FF]/45">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

/* ============================================================
   SHUFFLE ROLL
   ============================================================ */
function ShuffleRoll({
  target,
  names,
  reduce,
}: {
  target: string;
  names: string[];
  reduce: boolean;
}) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    let active = true;
    const start = Date.now();
    let i = 0;

    function tick() {
      if (!active) return;
      const pick = names.length > 0 ? names[i % names.length] : target;
      setDisplay(pick ?? target);
      i++;
      const elapsed = Date.now() - start;
      let delay = 90;
      if (elapsed > 1800) delay = 140 + (elapsed - 1800) * 0.12;
      if (elapsed > 2600) delay = 230 + (elapsed - 2600) * 0.25;
      setTimeout(tick, delay);
    }
    tick();
    return () => {
      active = false;
    };
  }, [names, target, reduce]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <span className="chip-live rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em]">
        Selecting player…
      </span>
      <motion.p
        key={display}
        initial={{ opacity: 0.4, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-5 font-[family-name:var(--font-display)] text-3xl font-bold text-[#F0F4FF] sm:text-5xl"
      >
        {display}
      </motion.p>
      <div className="mt-5 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            className="h-2 w-2 rounded-full bg-[#FF4D6D]"
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STAGE
   ============================================================ */
function EmptyStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <motion.div
        animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-5xl"
      >
        🏏
      </motion.div>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[#F0F4FF]">
        Awaiting next player
      </p>
      <p className="text-sm text-[#F0F4FF]/55">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}