"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";
import { useAuctionRealtime } from "./useAuctionRealtime";
import { OnBlockStage } from "./OnBlockStage";
import { TeamsRow } from "./TeamsRow";
import { PlayerTabs } from "./PlayerTabs";
import { SoldPopup, UnsoldBanner } from "./SoldPopup";
import { ProjectionMode } from "./ProjectionMode";
import type { DisplayField } from "@/lib/tournament/player-field-value";

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

type Props = {
  tournament: Tables<"tournaments">;
  initialPlayers: Tables<"players">[];
  initialTeams: Tables<"teams">[];
  initialState: Tables<"auction_state"> | null;
  blockDisplayFields: DisplayField[];
};

export function AuctionRoom({
  tournament,
  initialPlayers,
  initialTeams,
  initialState,
  blockDisplayFields,
}: Props) {
  const {
    state,
    players,
    teams,
    soldEvent,
    unsoldEvent,
    dismissSold,
    dismissUnsold,
  } = useAuctionRealtime(tournament.id, {
    initialState,
    initialPlayers,
    initialTeams,
  });

  const [projectionOpen, setProjectionOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (projectionOpen) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setProjectionOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [projectionOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (projectionOpen) {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [projectionOpen]);

  const onBlockPlayer = state?.current_player_id
    ? players.find((p) => p.id === state.current_player_id) ?? null
    : null;

  const currentHighestTeam = state?.current_highest_team_id
    ? teams.find((t) => t.id === state.current_highest_team_id) ?? null
    : null;

  const stats = useMemo(() => {
    let pending = 0;
    let sold = 0;
    let unsold = 0;
    for (const p of players) {
      if (p.status === "pending") pending++;
      else if (p.status === "sold") sold++;
      else if (p.status === "unsold") unsold++;
    }
    return { pending, sold, unsold, total: players.length };
  }, [players]);

  return (
    <div className="min-h-screen w-full bg-[#050A08] text-cream">
      {/* ============================================================
          STICKY HEADER — redesigned
          ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-mint/10 bg-[#0A1410]/95 backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* LEFT — poster + LIVE + name */}
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            {tournament.poster_url ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-mint/35 shadow-[0_0_20px_-4px_rgba(216,243,220,0.55)] md:h-11 md:w-11">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tournament.poster_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-mint/35 bg-[#0F231A] text-lg md:h-11 md:w-11">
                🏏
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sold px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_0_18px_-4px_rgba(193,18,31,0.9)] md:px-2.5 md:py-1 md:text-[10px]">
                  <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  Live
                </span>
                <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.24em] text-cream/40 sm:inline">
                  Auction Floor
                </span>
              </div>
              <h1 className="mt-0.5 max-w-[10rem] truncate font-[family-name:var(--font-display)] text-[15px] font-bold leading-tight text-cream text-glow-mint sm:max-w-none sm:text-base md:text-lg">
                {tournament.name}
              </h1>
            </div>
          </div>

          {/* RIGHT — pool summary + projection */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {/* Pool summary — hidden on very small screens, replaces old LOT chip */}
            <div className="hidden items-center gap-2 rounded-full border border-mint/15 bg-[#050A08]/70 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] sm:flex">
              <span className="flex items-center gap-1.5 text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                {stats.pending}
                <span className="text-cream/40">up</span>
              </span>
              <span className="text-cream/20">·</span>
              <span className="flex items-center gap-1.5 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {stats.sold}
                <span className="text-cream/40">sold</span>
              </span>
              <span className="text-cream/20">·</span>
              <span className="flex items-center gap-1.5 text-[#FFA000]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFA000]" />
                {stats.unsold}
                <span className="text-cream/40">unsold</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setProjectionOpen(true)}
              title="Presentation mode (P)"
              aria-label="Open presentation mode"
              className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-mint/25 bg-[#050A08] text-base text-mint/85 transition-all duration-200 hover:border-mint/60 hover:bg-mint hover:text-forest hover:shadow-[0_0_24px_-4px_rgba(216,243,220,0.7)] md:h-10 md:w-10"
            >
              <span aria-hidden className="transition-transform duration-200 group-hover:scale-110">
                ⛶
              </span>
            </button>
          </div>
        </div>

        {/* Mint → success → mint gradient line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-mint to-transparent" />
      </header>

      {/* ============================================================
          HERO SECTION — On Block + Current Bid (stadium image bg)
          ============================================================ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#050A08]/55" />
          <div
            className="absolute inset-x-0 top-0 h-[45%]"
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,232,184,0.22), transparent 65%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050A08] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <div className="mb-5 flex items-center gap-3 md:mb-7">
            <span className="cz-pulse-dot inline-block h-2 w-2 rounded-full bg-sold" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint/85">
              Now on the floor
            </p>
          </div>

          <OnBlockStage
            state={state}
            onBlockPlayer={onBlockPlayer}
            currentHighestTeam={currentHighestTeam}
            players={players}
            blockDisplayFields={blockDisplayFields}
            shuffleEnabled={state?.shuffle_enabled ?? true}
          />
        </div>
      </section>

      {/* ============================================================
          BELOW-FOLD — solid dark green
          ============================================================ */}
      <section className="relative bg-[#050A08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[200px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(27,67,50,0.35), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <SectionHeader kicker="Franchises" title="Teams" />
          <TeamsRow
            teams={teams}
            players={players}
            bidMode={state?.bid_mode ?? "normal"}
            starBasePrice={state?.star_base_price ?? 1000}
          />

          <div className="mt-12 md:mt-14">
            <SectionHeader kicker="Player Pool" title="Roster" />
            <PlayerTabs
              players={players}
              teams={teams}
              onBlockPlayerId={state?.current_player_id ?? null}
            />
          </div>
        </div>
      </section>

      {soldEvent && (
        <SoldPopup
          player={soldEvent.player}
          team={soldEvent.team}
          price={soldEvent.price}
          onClose={dismissSold}
        />
      )}
      {unsoldEvent && (
        <UnsoldBanner player={unsoldEvent.player} onClose={dismissUnsold} />
      )}

      <ProjectionMode
        open={projectionOpen}
        onClose={() => setProjectionOpen(false)}
        state={state}
        onBlockPlayer={onBlockPlayer}
        currentHighestTeam={currentHighestTeam}
        tournamentName={tournament.name}
      />
    </div>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
          {kicker}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-cream md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="h-[3px] w-24 rounded-full bg-gradient-to-r from-mint via-success to-transparent md:w-32" />
    </div>
  );
}