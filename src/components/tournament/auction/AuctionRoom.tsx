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
    <>
      {/* ============ FIXED HERO BACKGROUND ============ */}
      <div aria-hidden className="fixed inset-0 z-0 bg-[#0B1020]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Single readability overlay — much lighter than before */}
        <div className="absolute inset-0 bg-[#0B1020]/70" />
        {/* Stronger at bottom for section legibility */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#0B1020] via-[#0B1020]/70 to-transparent" />
        {/* Warm floodlight bloom at top (matches landing hero) */}
        <div
          className="absolute inset-x-0 top-0 h-[45%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,201,60,0.18), transparent 65%)",
          }}
        />
      </div>

      {/* ============ CONTENT ============ */}
      <div className="relative z-10 min-h-screen w-full text-[#F0F4FF]">
        <header className="sticky top-0 z-40 bg-[#0B1020]/75">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {tournament.poster_url && (
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#FFC93C]/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tournament.poster_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex min-w-0 items-center gap-3">
                <span className="chip-live inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em]">
                  <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  Live
                </span>
                <h1 className="min-w-0 truncate font-[family-name:var(--font-display)] text-base font-bold text-[#F0F4FF] md:text-lg">
                  {tournament.name}
                </h1>
              </div>
            </div>

            <div className="hidden flex-1 justify-center md:flex">
              <span className="chip-gold inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em]">
                LOT {String(stats.lotNumber).padStart(2, "0")}
                <span className="text-[#FFC93C]/40">/</span>
                {String(stats.total).padStart(2, "0")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setProjectionOpen(true)}
              title="Presentation mode (P)"
              aria-label="Open presentation mode"
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FFC93C]/25 bg-[#0B1020]/60 text-base text-[#FFC93C]/80 transition hover:bg-[#FFC93C] hover:text-[#0B1020]"
            >
              <span aria-hidden>⛶</span>
            </button>
          </div>

          <div className="h-[2px] w-full bg-gradient-to-r from-[#FFC93C] via-[#FF4D6D] to-[#00D9FF]" />

          <div className="border-b border-[#FFC93C]/10 bg-[#0B1020]/55 px-4 py-1.5 md:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#F0F4FF]/45">
              <span className="truncate">
                {tournament.venue ? `📍 ${tournament.venue}` : "🏏 CRICZONE · LIVE"}
              </span>
              <span className="hidden shrink-0 md:inline">
                <span className="text-[#00D9FF]">{stats.pending}</span> Upcoming
                <span className="mx-2 text-[#F0F4FF]/20">·</span>
                <span className="text-[#B8FF3C]">{stats.sold}</span> Sold
                <span className="mx-2 text-[#F0F4FF]/20">·</span>
                <span className="text-[#FF4D6D]">{stats.unsold}</span> Unsold
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <OnBlockStage
            state={state}
            onBlockPlayer={onBlockPlayer}
            currentHighestTeam={currentHighestTeam}
            players={players}
          />

          <section className="mt-10">
            <SectionHeader kicker="Franchises" title="Teams" accent="gold" />
            <TeamsRow teams={teams} players={players} />
          </section>

          <section className="mt-12">
            <SectionHeader kicker="Player Pool" title="Roster" accent="coral" />
            <PlayerTabs
              players={players}
              teams={teams}
              onBlockPlayerId={state?.current_player_id ?? null}
            />
          </section>
        </main>
      </div>

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
    </>
  );
}

function SectionHeader({
  kicker,
  title,
  accent,
}: {
  kicker: string;
  title: string;
  accent: "gold" | "coral";
}) {
  const kickerCls = accent === "coral" ? "text-[#FF4D6D]" : "text-[#FFC93C]";
  const barCls =
    accent === "coral"
      ? "from-[#FF4D6D] to-transparent"
      : "from-[#FFC93C] to-transparent";
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p
          className={`text-[10px] font-extrabold uppercase tracking-[0.32em] ${kickerCls}`}
        >
          {kicker}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[#F0F4FF] md:text-3xl">
          {title}
        </h2>
      </div>
      <div className={`h-[3px] w-24 bg-gradient-to-r md:w-32 ${barCls}`} />
    </div>
  );
}