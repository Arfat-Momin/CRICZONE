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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — Player / Shuffle */}
      <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-mint/12 bg-[#0A1410] shadow-[0_0_60px_-25px_rgba(216,243,220,0.3)]">
        {shuffling ? (
          <ShuffleRoll target={shuffling} names={rollPool} reduce={!!reduce} />
        ) : onBlockPlayer ? (
          <PlayerBlockCard player={onBlockPlayer} />
        ) : (
          <EmptyStage reduce={!!reduce} />
        )}
      </div>

      {/* RIGHT — Current Bid */}
      <div className="flex flex-col justify-center rounded-3xl border border-mint/15 bg-gradient-to-b from-[#0F231A] to-[#0A1410] p-6 shadow-[0_0_60px_-25px_rgba(216,243,220,0.35)]">
        <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint/70">
          Current Bid
        </p>
        <BidNumber
          value={state?.current_bid_price ?? 0}
          teamName={currentHighestTeam?.team_name ?? null}
        />
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-cream/45">
          Mode: {state?.bid_mode === "star" ? "Star (×1000)" : "Normal"}
        </p>
      </div>
    </div>
  );
}

function BidNumber({ value, teamName }: { value: number; teamName: string | null }) {
  const reduce = useReducedMotion();
  const display = value > 0 ? value.toFixed(1).replace(/\.0$/, "") : "—";
  return (
    <motion.div
      key={`${value}-${teamName ?? ""}`}
      initial={reduce ? false : { scale: 0.9, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="mt-3 text-center"
    >
      <p className="font-[family-name:var(--font-numeric)] text-6xl font-bold leading-none text-mint text-glow-mint sm:text-7xl">
        {display}
      </p>
      <div className="mt-4 flex justify-center">
        <span className="rounded-full border border-mint/25 bg-mint/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.28em] text-mint">
          {teamName ?? "No bids yet"}
        </span>
      </div>
    </motion.div>
  );
}

function PlayerBlockCard({ player }: { player: Tables<"players"> }) {
  const photo =
    player.photo_url || "https://placehold.co/400x400/0A1410/D8F3DC?text=%3F";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
    >
      <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-4 border-mint/40 shadow-[0_0_50px_-15px_rgba(216,243,220,0.55)] sm:h-52 sm:w-52">
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="eager"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <span className="inline-block rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint">
          ⚡ On the Block
        </span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-cream text-glow-mint sm:text-4xl">
          {player.full_name}
        </h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          {player.category && <Pill label="Category" value={player.category} />}
          {player.jersey_no != null && (
            <Pill label="Jersey" value={`#${player.jersey_no}`} />
          )}
          {player.jersey_size && <Pill label="Size" value={player.jersey_size} />}
          {player.current_team && (
            <Pill label="Current Team" value={player.current_team} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-mint/12 bg-[#050A08] px-3 py-1 text-xs">
      <span className="mr-1 font-bold uppercase tracking-wider text-cream/45">
        {label}:
      </span>
      <span className="font-semibold text-mint">{value}</span>
    </span>
  );
}

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
      <span className="rounded-full border border-sold/40 bg-sold/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-sold">
        Selecting player…
      </span>
      <motion.p
        key={display}
        initial={{ opacity: 0.4, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-cream text-glow-mint sm:text-5xl"
      >
        {display}
      </motion.p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            className="h-2 w-2 rounded-full bg-sold"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <motion.div
        animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-4xl"
      >
        🏏
      </motion.div>
      <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-cream">
        Awaiting next player
      </p>
      <p className="mt-1 text-sm text-cream/55">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}