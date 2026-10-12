"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import { CardCascadeShuffle } from "./CardCascadeShuffle";
import {
  getPlayerFieldValue,
  type DisplayField,
} from "@/lib/tournament/player-field-value";

type Props = {
  state: Tables<"auction_state"> | null;
  onBlockPlayer: Tables<"players"> | null;
  currentHighestTeam: Tables<"teams"> | null;
  players: Tables<"players">[];
  blockDisplayFields: DisplayField[];
};

export function OnBlockStage({
  state,
  onBlockPlayer,
  currentHighestTeam,
  players,
  blockDisplayFields,
}: Props) {
  const reduce = useReducedMotion();
  const [shuffling, setShuffling] = useState<string | null>(null);

  useEffect(() => {
    if (state?.shuffling_name) {
      setShuffling(state.shuffling_name);
    } else {
      setShuffling(null);
    }
  }, [state?.shuffling_name]);

  const rollPool = useMemo(() => {
    const names = players
      .filter((p) => p.status === "pending" || p.status === "unsold")
      .map((p) => p.full_name)
      .filter((n) => n !== shuffling);
    return names.length > 0 ? names : ["…", "…", "…"];
  }, [players, shuffling]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-6">
      {/* LEFT — On the Block */}
      <div className="relative overflow-hidden rounded-2xl border border-mint/35 bg-[#0A1410]/55 dot-grid shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_45px_-18px_rgba(216,243,220,0.35)] sm:rounded-3xl">
        {shuffling ? (
          <CardCascadeShuffle
            target={shuffling}
            names={rollPool}
            reduce={!!reduce}
          />
        ) : onBlockPlayer ? (
          <PlayerBlockCard
            player={onBlockPlayer}
            displayFields={blockDisplayFields}
          />
        ) : (
          <EmptyStage reduce={!!reduce} />
        )}
      </div>

      {/* RIGHT — Current Bid */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-mint/40 bg-gradient-to-br from-[#0F231A]/65 via-[#0A1410]/70 to-[#050A08]/75 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_50px_-20px_rgba(216,243,220,0.4)] sm:rounded-3xl sm:p-6">
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
        />
      </div>
    </div>
  );
}

function BidNumber({
  value,
  teamName,
  teamPhoto,
}: {
  value: number;
  teamName: string | null;
  teamPhoto: string | null;
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
      className="my-3 text-center sm:my-4"
    >
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-[family-name:var(--font-numeric)] text-5xl font-bold leading-none text-mint text-glow-mint sm:text-[5.5rem] md:text-[7rem]">
          {display}
        </span>
        <span className="text-xs font-extrabold uppercase tracking-[0.28em] text-mint/65 sm:text-sm md:text-base">
          pts
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 sm:mt-5">
        {teamName ? (
          <>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-mint/45 bg-[#050A08] sm:h-10 sm:w-10">
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
            <span className="max-w-[12rem] truncate font-[family-name:var(--font-display)] text-lg font-bold text-cream sm:max-w-[16rem] sm:text-xl md:text-2xl">
              {teamName}
            </span>
          </>
        ) : (
          <span className="rounded-full border border-cream/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/45 sm:px-4 sm:text-xs">
            No bids yet
          </span>
        )}
      </div>
    </motion.div>
  );
}

function PlayerBlockCard({
  player,
  displayFields,
}: {
  player: Tables<"players">;
  displayFields: DisplayField[];
}) {
  const photo =
    player.photo_url || "https://placehold.co/400x400/0A1410/D8F3DC?text=%3F";

  const pills = displayFields
    .filter((f) => f.id !== "basePrice")
    .map((f) => ({
      label: f.label,
      value: getPlayerFieldValue(player, f.id),
    }))
    .filter((x): x is { label: string; value: string } => !!x.value);

  const basePriceField = displayFields.find((f) => f.id === "basePrice");
  const basePriceValue =
    basePriceField && player.base_price != null
      ? `${player.base_price} pts`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center gap-5 p-5 text-center sm:p-7 md:flex-row md:items-center md:gap-7 md:p-8 md:text-left"
    >
      <div className="relative shrink-0">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-mint md:absolute md:-left-2 md:-top-2 md:z-10 md:mb-0 md:bg-[#050A08]/95">
          ⚡ On the Block
        </span>

        <div className="mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border-2 border-mint/45 shadow-[0_0_45px_-12px_rgba(216,243,220,0.55)] sm:max-w-[240px] md:mx-0 md:h-48 md:w-48 md:max-w-none lg:h-56 lg:w-56">
          <ZoomableImage
            src={photo}
            alt={player.full_name}
            loading="eager"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>

      <div className="min-w-0 w-full flex-1">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-cream text-glow-mint sm:text-3xl md:text-4xl lg:text-5xl">
          {player.full_name}
        </h2>

        {pills.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:mt-4 md:justify-start">
            {pills.map((p) => (
              <Pill key={p.label} label={p.label} value={p.value} tone="mint" />
            ))}
          </div>
        )}

        {basePriceValue && (
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/40 md:mt-5">
            Base price ·{" "}
            <span className="text-mint/85">{basePriceValue}</span>
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
      className={`inline-flex items-center gap-1 rounded-lg border bg-[#050A08] px-2 py-1 text-[11px] sm:px-2.5 sm:text-xs ${toneCls}`}
    >
      <span className="font-bold uppercase tracking-[0.14em] text-cream/45 sm:tracking-[0.18em]">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function EmptyStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center sm:min-h-[320px]">
      <motion.div
        animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-5xl"
      >
        🏏
      </motion.div>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-cream sm:text-3xl">
        Awaiting next player
      </p>
      <p className="max-w-xs text-sm text-cream/55">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}