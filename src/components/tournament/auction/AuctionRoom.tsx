"use client";

import type { Tables } from "@/types/supabase";
import { useAuctionRealtime } from "./useAuctionRealtime";
import { OnBlockStage } from "./OnBlockStage";
import { TeamsRow } from "./TeamsRow";
import { PlayerTabs } from "./PlayerTabs";
import { SoldPopup, UnsoldBanner } from "./SoldPopup";

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

  const onBlockPlayer = state?.current_player_id
    ? players.find((p) => p.id === state.current_player_id) ?? null
    : null;

  const currentHighestTeam = state?.current_highest_team_id
    ? teams.find((t) => t.id === state.current_highest_team_id) ?? null
    : null;

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="sticky top-0 z-40 border-b border-[#1B4332]/10 bg-[#1B4332] text-cream shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {tournament.poster_url && (
              <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md border border-cream/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tournament.poster_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <p className="min-w-0 flex-1 truncate font-[family-name:var(--font-display)] text-base font-bold md:text-lg">
              {tournament.name}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sold px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
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
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold text-forest md:text-2xl">
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
    </div>
  );
}