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

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

type Props = {
  tournament: Tables<"tournaments">;
  initialPlayers: Tables<"players">[];
  initialTeams: Tables<"teams">[];
  initialState: Tables<"auction_state"> | null;
};

export function AuctionRoom({
  tournament,
  initialPlayers,
  initialTeams,
  initialState,
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
    const total = players.length;
    const lotNumber = Math.min(sold + unsold + (onBlockPlayer ? 1 : 0), total);
    return { pending, sold, unsold, total, lotNumber };
  }, [players, onBlockPlayer]);

  return (
    <div className="min-h-screen w-full bg-[#050A08] text-cream">
      {/* ============================================================
          STICKY HEADER — dark green, mint accent line
          ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-mint/10 bg-[#050A08]/95">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {tournament.poster_url && (
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-mint/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tournament.poster_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sold px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_0_20px_-6px_rgba(193,18,31,0.75)]">
                <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                Live
              </span>
              <h1 className="min-w-0 truncate font-[family-name:var(--font-display)] text-base font-bold text-cream md:text-lg">
                {tournament.name}
              </h1>
            </div>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-mint">
              LOT {String(stats.lotNumber).padStart(2, "0")}
              <span className="text-mint/40">/</span>
              {String(stats.total).padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProjectionOpen(true)}
            title="Presentation mode (P)"
            aria-label="Open presentation mode"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint/25 bg-[#0A1410] text-base text-mint/85 transition hover:bg-mint hover:text-forest"
          >
            <span aria-hidden>⛶</span>
          </button>
        </div>

        {/* Broadcast gradient bar — mint glow */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#1B4332] via-[#D8F3DC] to-[#1B4332]" />

        {/* Info strip */}
        <div className="border-b border-mint/10 bg-[#050A08] px-4 py-1.5 md:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-cream/45">
            <span className="truncate">
              {tournament.venue ? `📍 ${tournament.venue}` : "🏏 CRICZONE · LIVE"}
            </span>
            <span className="hidden shrink-0 md:inline">
              <span className="text-mint">{stats.pending}</span> Upcoming
              <span className="mx-2 text-cream/20">·</span>
              <span className="text-success">{stats.sold}</span> Sold
              <span className="mx-2 text-cream/20">·</span>
              <span className="text-[#FFA000]">{stats.unsold}</span> Unsold
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO SECTION — On Block + Current Bid (stadium image bg)
          ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Image + overlays */}
        <div aria-hidden className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#050A08]/72" />
          {/* Warm floodlight at top — matches landing hero */}
          <div
            className="absolute inset-x-0 top-0 h-[45%]"
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,232,184,0.16), transparent 65%)",
            }}
          />
          {/* Blend into the solid dark green below */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050A08] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          {/* Kicker above the on-block stage */}
          <div className="mb-6 flex items-center gap-3 md:mb-8">
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
          />
        </div>
      </section>

      {/* ============================================================
          BELOW-FOLD — solid dark green theme
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

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeader kicker="Franchises" title="Teams" />
          <TeamsRow teams={teams} players={players} />

          <div className="mt-14">
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