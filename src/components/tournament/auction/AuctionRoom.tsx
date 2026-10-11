"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/types/supabase";
import { useAuctionRealtime } from "./useAuctionRealtime";
import { OnBlockStage } from "./OnBlockStage";
import { TeamsRow } from "./TeamsRow";
import { PlayerTabs } from "./PlayerTabs";
import { SoldPopup, UnsoldBanner } from "./SoldPopup";
import { ProjectionMode } from "./ProjectionMode";

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
      if (
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      ) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [projectionOpen]);

  const onBlockPlayer = state?.current_player_id
    ? players.find((p) => p.id === state.current_player_id) ?? null
    : null;

  const currentHighestTeam = state?.current_highest_team_id
    ? teams.find((t) => t.id === state.current_highest_team_id) ?? null
    : null;

  return (
    <div className="min-h-screen w-full">
      {/* Sticky header — solid bar (no backdrop-blur for perf) */}
      <header className="sticky top-0 z-40 border-b border-mint/10 bg-[#050A08]">
        <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-3 md:px-6">
          {tournament.poster_url && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 border-mint/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tournament.poster_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h1 className="truncate text-center font-[family-name:var(--font-display)] text-base font-bold text-cream md:text-lg">
            {tournament.name}
          </h1>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sold px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
            <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
            LIVE
          </span>

          <button
            type="button"
            onClick={() => setProjectionOpen(true)}
            title="Presentation mode (P)"
            aria-label="Open presentation mode"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-mint/20 bg-[#0A1410] text-base text-mint/70 transition hover:bg-mint hover:text-forest md:right-4"
          >
            <span aria-hidden>⛶</span>
          </button>
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
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold text-cream md:text-2xl">
            Teams
          </h2>
          <TeamsRow teams={teams} players={players} />
        </section>

        <section className="mt-10">
          <PlayerTabs
            players={players}
            teams={teams}
            onBlockPlayerId={state?.current_player_id ?? null}
          />
        </section>
      </main>

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