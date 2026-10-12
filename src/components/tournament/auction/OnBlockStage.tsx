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
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.55fr_1fr] lg:gap-5 xl:gap-6">
      {/* ============================================================
          LEFT — ON THE BLOCK
          Fixed responsive height — shuffle, player, empty all fill it.
          ============================================================ */}
      <div className="relative h-[290px] overflow-hidden rounded-2xl border border-mint/35 bg-[#0A1410]/55 dot-grid shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_45px_-18px_rgba(216,243,220,0.35)] sm:h-[330px] sm:rounded-3xl md:h-[360px] lg:h-[400px] xl:h-[440px]">
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

      {/* ============================================================
          RIGHT — CURRENT BID
          Fixed responsive height — same as left on lg+ so the two
          boxes align. Shorter on mobile so the page doesn't scroll.
          ============================================================ */}
      <div className="relative flex h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-mint/40 bg-gradient-to-br from-[#0F231A]/65 via-[#0A1410]/70 to-[#050A08]/75 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_50px_-20px_rgba(216,243,220,0.4)] sm:h-[220px] sm:rounded-3xl sm:p-5 md:h-[240px] lg:h-[400px] lg:p-6 xl:h-[440px]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
            Current Bid
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cream/35">
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
      className="my-1 text-center"
    >
      <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
        <span className="font-[family-name:var(--font-numeric)] text-4xl font-bold leading-none text-mint text-glow-mint sm:text-5xl md:text-6xl lg:text-[6rem] xl:text-[7rem]">
          {display}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint/65 sm:text-xs md:text-sm lg:text-base">
          pts
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4 sm:gap-3">
        {teamName ? (
          <>
            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-mint/45 bg-[#050A08] sm:h-9 sm:w-9 lg:h-10 lg:w-10">
              {teamPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-mint sm:text-sm">
                  {initial}
                </div>
              )}
            </div>
            <span className="max-w-[10rem] truncate font-[family-name:var(--font-display)] text-base font-bold text-cream sm:max-w-[13rem] sm:text-lg lg:text-xl xl:text-2xl">
              {teamName}
            </span>
          </>
        ) : (
          <span className="rounded-full border border-cream/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/45 sm:px-4 sm:py-1.5 sm:text-xs">
            No bids yet
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   PLAYER BLOCK CARD — compact so it fits the fixed-height frame
   ============================================================ */
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
      className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-4 text-center sm:gap-3 sm:p-5 md:flex-row md:items-center md:gap-6 md:p-6 md:text-left lg:gap-7 lg:p-7"
    >
      {/* Photo + chip */}
      <div className="relative shrink-0">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.22em] text-mint sm:px-3 sm:py-1 sm:text-[10px] md:absolute md:-left-2 md:-top-2 md:z-10 md:mb-0 md:bg-[#050A08]/95">
          ⚡ On the Block
        </span>

        <div className="mx-auto aspect-square w-[110px] overflow-hidden rounded-xl border-2 border-mint/45 shadow-[0_0_35px_-10px_rgba(216,243,220,0.55)] sm:w-[130px] sm:rounded-2xl md:mx-0 md:h-40 md:w-40 lg:h-44 lg:w-44 xl:h-52 xl:w-52">
          <ZoomableImage
            src={photo}
            alt={player.full_name}
            loading="eager"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 w-full flex-1">
        <h2 className="line-clamp-2 font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-cream text-glow-mint sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
          {player.full_name}
        </h2>

        {pills.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 md:mt-3 md:justify-start lg:gap-2">
            {pills.map((p) => (
              <Pill key={p.label} label={p.label} value={p.value} tone="mint" />
            ))}
          </div>
        )}

        {basePriceValue && (
          <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.26em] text-cream/40 sm:text-[10px] md:mt-3 lg:mt-4">
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
      className={`inline-flex items-center gap-1 rounded-md border bg-[#050A08] px-1.5 py-0.5 text-[10px] sm:rounded-lg sm:px-2 sm:py-1 sm:text-[11px] lg:text-xs ${toneCls}`}
    >
      <span className="font-bold uppercase tracking-[0.12em] text-cream/45 sm:tracking-[0.16em]">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function EmptyStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center sm:gap-3 sm:p-8">
      <motion.div
        animate={reduce ? undefined : { rotate: [0, 8, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-4xl sm:text-5xl"
      >
        🏏
      </motion.div>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-cream sm:text-2xl md:text-3xl">
        Awaiting next player
      </p>
      <p className="max-w-xs text-xs text-cream/55 sm:text-sm">
        The auctioneer will draw the next name shortly.
      </p>
    </div>
  );
}