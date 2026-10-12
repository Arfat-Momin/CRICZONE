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
  shuffleEnabled?: boolean;
};

export function OnBlockStage({
  state,
  onBlockPlayer,
  currentHighestTeam,
  players,
  blockDisplayFields,
  shuffleEnabled = true,
}: Props) {
  const reduce = useReducedMotion();
  const [shuffling, setShuffling] = useState<string | null>(null);

  useEffect(() => {
    // Respect the admin's shuffle toggle — when disabled, never enter
    // the shuffle state, even if shuffling_name is briefly set.
    if (shuffleEnabled && state?.shuffling_name) {
      setShuffling(state.shuffling_name);
    } else {
      setShuffling(null);
    }
  }, [state?.shuffling_name, shuffleEnabled]);

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
          ============================================================ */}
      <div className="relative h-[300px] overflow-hidden rounded-2xl border border-mint/35 bg-[#0A1410]/55 dot-grid shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_45px_-18px_rgba(216,243,220,0.35)] sm:h-[340px] sm:rounded-3xl md:h-[370px] lg:h-[420px] xl:h-[460px]">
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
          Vertical layout:
            · top:    kicker label (CURRENT BID)
            · center: hero number (biggest element, centered)
            · bottom: team badge (photo + name together)
          ============================================================ */}
      <div className="relative flex h-[300px] flex-col overflow-hidden rounded-2xl border border-mint/40 bg-gradient-to-br from-[#0F231A]/65 via-[#0A1410]/70 to-[#050A08]/75 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75),0_0_50px_-20px_rgba(216,243,220,0.4)] sm:h-[340px] sm:rounded-3xl md:h-[370px] lg:h-[420px] xl:h-[460px]">
        {/* Ambient glow behind the number */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/3 h-1/3"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(216,243,220,0.14), transparent 70%)",
          }}
        />

        <CurrentBidContent
          value={state?.current_bid_price ?? 0}
          teamName={currentHighestTeam?.team_name ?? null}
          teamPhoto={currentHighestTeam?.photo_url ?? null}
          reduce={!!reduce}
        />
      </div>
    </div>
  );
}

/* ============================================================
   CURRENT BID CONTENT
   Two zones: hero number (center) + team badge (bottom)
   ============================================================ */
function CurrentBidContent({
  value,
  teamName,
  teamPhoto,
  reduce,
}: {
  value: number;
  teamName: string | null;
  teamPhoto: string | null;
  reduce: boolean;
}) {
  const display = value > 0 ? value.toFixed(1).replace(/\.0$/, "") : "—";
  const initial = teamName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative flex h-full flex-col px-5 py-5 sm:px-6 sm:py-6 md:py-7">
      {/* ============ TOP KICKER ============ */}
      <p className="shrink-0 text-center text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint/85 sm:text-xs sm:tracking-[0.34em]">
        Current Bid
      </p>

      {/* ============ HERO NUMBER (centered in remaining space) ============ */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          key={`num-${value}`}
          initial={reduce ? false : { scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="flex items-baseline justify-center gap-1.5 sm:gap-2"
        >
          <span className="font-[family-name:var(--font-numeric)] text-[3.25rem] font-bold leading-[0.95] tracking-tight text-mint sm:text-[3.75rem] md:text-[4.25rem] lg:text-[4.75rem] xl:text-[5.25rem]">
            {display}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-mint/60 sm:text-xs md:text-sm">
            pts
          </span>
        </motion.div>

        {/* Subtle underline accent */}
        <span
          aria-hidden
          className="mt-2 h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent via-mint/50 to-transparent sm:mt-3 sm:w-16"
        />
      </div>

      {/* ============ TEAM BADGE (photo + name together at bottom) ============ */}
      {teamName ? (
        <motion.div
          key={`team-${teamName}`}
          initial={reduce ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0"
        >
          <div className="mx-auto flex max-w-full items-center gap-2.5 rounded-2xl border border-mint/25 bg-[#050A08]/70 px-3 py-2.5 shadow-[0_0_25px_-10px_rgba(216,243,220,0.35)] sm:gap-3 sm:px-3.5 sm:py-3">
            {/* Square photo */}
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-mint/45 bg-[#0A1410] sm:h-12 sm:w-12 md:h-14 md:w-14">
              {teamPhoto ? (
                <ZoomableImage
                  src={teamPhoto}
                  alt={teamName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-bold text-mint sm:text-lg">
                  {initial}
                </div>
              )}
            </div>

            {/* Text — team name + "leading" tag */}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-mint/60 sm:text-[10px]">
                Highest Bidder
              </p>
              <p className="line-clamp-1 font-[family-name:var(--font-display)] text-sm font-bold leading-tight text-cream sm:text-base md:text-lg lg:text-xl">
                {teamName}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="shrink-0">
          <div className="mx-auto flex max-w-full items-center justify-center gap-2.5 rounded-2xl border border-dashed border-cream/20 bg-[#050A08]/40 px-3 py-2.5 sm:py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-cream/20 text-lg text-cream/35 sm:h-12 sm:w-12 md:h-14 md:w-14 md:text-xl">
              ?
            </span>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-cream/40 sm:text-[10px]">
                Waiting
              </p>
              <p className="text-sm font-semibold text-cream/60 sm:text-base">
                No bids yet
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PLAYER BLOCK CARD
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

      <div className="min-w-0 w-full flex-1">
        <h2 className="line-clamp-2 font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-cream sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
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