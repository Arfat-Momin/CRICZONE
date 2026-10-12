"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import { CardCascadeShuffle } from "./CardCascadeShuffle";

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

  // React to shuffling_name changes from realtime
  useEffect(() => {
    if (state?.shuffling_name) {
      setShuffling(state.shuffling_name);
    } else {
      setShuffling(null);
    }
  }, [state?.shuffling_name]);

  // Pool of names to cycle through during the shuffle
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
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-mint/35 bg-[#0A1410]/55 dot-grid shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_45px_-18px_rgba(216,243,220,0.35)]">
        {shuffling ? (
          <CardCascadeShuffle
            target={shuffling}
            names={rollPool}
            reduce={!!reduce}
          />
        ) : onBlockPlayer ? (
          <PlayerBlockCard player={onBlockPlayer} />
        ) : (
          <EmptyStage reduce={!!reduce} />
        )}
      </div>

      {/* ============ RIGHT — CURRENT BID ============ */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-mint/40 bg-gradient-to-br from-[#0F231A]/65 via-[#0A1410]/70 to-[#050A08]/75 p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_50px_-20px_rgba(216,243,220,0.4)]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
            Current Bid
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cream/35">
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
          <span className="text-cream/35">Bid mode</span>
          <span
            className={
              state?.bid_mode === "star"
                ? "rounded-full border border-mint/35 bg-mint/10 px-2 py-0.5 text-mint"
                : "rounded-full border border-cream/20 px-2 py-0.5 text-cream/60"
            }
          >
            {state?.bid_mode === "star" ? "★ Star ×1000" : "Normal"}
          </span>
        </div>
      </div>
    </div>
  );
}

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
        <span className="font-[family-name:var(--font-numeric)] text-[5.5rem] font-bold leading-none text-mint text-glow-mint md:text-[7rem]">
          {display}
        </span>
        <span className="text-sm font-extrabold uppercase tracking-[0.28em] text-mint/65 md:text-base">
          pts
        </span>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {teamName ? (
          <>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-mint/45 bg-[#050A08]">
              {teamPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-mint">
                  {initial}
                </div>
              )}
            </div>
            <span className="max-w-[16rem] truncate font-[family-name:var(--font-display)] text-xl font-bold text-cream md:text-2xl">
              {teamName}
            </span>
          </>
        ) : (
          <span className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.28em] text-cream/45">
            No bids yet
          </span>
        )}
      </div>
      {mode === "star" && (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-mint/55">
          Star mode · increments of 1000
        </p>
      )}
    </motion.div>
  );
}

function PlayerBlockCard({ player }: { player: Tables<"players"> }) {
  const photo =
    player.photo_url || "https://placehold.co/400x400/0A1410/D8F3DC?text=%3F";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
    >
      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-mint sm:left-7 sm:top-7">
        ⚡ On the Block
      </span>

      <div className="mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-mint/45 shadow-[0_0_45px_-12px_rgba(216,243,220,0.55)] sm:mx-0 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="eager"
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div className="min-w-0 flex-1 text-center sm:pt-8 sm:text-left">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-cream text-glow-mint sm:text-4xl lg:text-5xl">
          {player.full_name}
        </h2>

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {player.category && (
            <Pill label="Role" value={player.category} tone="mint" />
          )}
          {player.jersey_no != null && (
            <Pill label="Jersey" value={`#${player.jersey_no}`} />
          )}
          {player.jersey_size && (
            <Pill label="Size" value={player.jersey_size} />
          )}
          {player.current_team && (
            <Pill label="From" value={player.current_team} />
          )}
        </div>

        {player.base_price != null && (
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/40">
            Base price ·{" "}
            <span className="text-mint/85">{player.base_price} pts</span>
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
  tone?: "mint";
}) {
  const toneCls =
    tone === "mint"
      ? "border-mint/35 text-mint"
      : "border-cream/15 text-cream/85";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border bg-[#050A08] px-2.5 py-1 text-xs ${toneCls}`}
    >
      <span className="font-bold uppercase tracking-[0.18em] text-cream/45">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

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
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-cream">
        Awaiting next player
      </p>
      <p className="text-sm text-cream/55">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}