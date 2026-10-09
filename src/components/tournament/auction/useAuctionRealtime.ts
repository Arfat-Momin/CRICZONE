"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

type InitialData = {
  initialState: Tables<"auction_state"> | null;
  initialPlayers: Tables<"players">[];
  initialTeams: Tables<"teams">[];
};

export type SoldEvent = {
  player: Tables<"players">;
  team: Tables<"teams">;
  price: number;
};

export type UnsoldEvent = {
  player: Tables<"players">;
};

export function useAuctionRealtime(tournamentId: string, initial: InitialData) {
  const [state, setState] = useState<Tables<"auction_state"> | null>(
    initial.initialState,
  );
  const [players, setPlayers] = useState<Tables<"players">[]>(initial.initialPlayers);
  const [teams, setTeams] = useState<Tables<"teams">[]>(initial.initialTeams);
  const [soldEvent, setSoldEvent] = useState<SoldEvent | null>(null);
  const [unsoldEvent, setUnsoldEvent] = useState<UnsoldEvent | null>(null);

  const prevStatusRef = useRef<Record<string, Tables<"players">["status"]> | null>(null);
  const teamsRef = useRef(teams);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    if (prevStatusRef.current) return;
    const map: Record<string, Tables<"players">["status"]> = {};
    for (const p of initial.initialPlayers) map[p.id] = p.status;
    prevStatusRef.current = map;
  }, [initial.initialPlayers]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`auction-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auction_state",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.new) {
            setState(payload.new as Tables<"auction_state">);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const row = payload.new as Tables<"players">;
            const prevStatus = prevStatusRef.current?.[row.id];
            setPlayers((prev) => prev.map((p) => (p.id === row.id ? row : p)));
            if (prevStatusRef.current) prevStatusRef.current[row.id] = row.status;

            if (
              prevStatus === "on_block" &&
              row.status === "sold" &&
              row.sold_to_team_id &&
              (row.selling_price ?? 0) > 0
            ) {
              const team = teamsRef.current.find((t) => t.id === row.sold_to_team_id);
              if (team) {
                setSoldEvent({ player: row, team, price: row.selling_price ?? 0 });
              }
            }
            if (prevStatus === "on_block" && row.status === "unsold") {
              setUnsoldEvent({ player: row });
            }
          } else if (payload.eventType === "INSERT") {
            const row = payload.new as Tables<"players">;
            setPlayers((prev) => [...prev, row]);
            if (prevStatusRef.current) prevStatusRef.current[row.id] = row.status;
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<Tables<"players">>;
            if (oldRow.id) {
              setPlayers((prev) => prev.filter((p) => p.id !== oldRow.id));
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const row = payload.new as Tables<"teams">;
            setTeams((prev) => prev.map((t) => (t.id === row.id ? row : t)));
          } else if (payload.eventType === "INSERT") {
            const row = payload.new as Tables<"teams">;
            setTeams((prev) => [...prev, row]);
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<Tables<"teams">>;
            if (oldRow.id) {
              setTeams((prev) => prev.filter((t) => t.id !== oldRow.id));
            }
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  useEffect(() => {
    if (!soldEvent) return;
    const id = setTimeout(() => setSoldEvent(null), 4200);
    return () => clearTimeout(id);
  }, [soldEvent]);

  useEffect(() => {
    if (!unsoldEvent) return;
    const id = setTimeout(() => setUnsoldEvent(null), 3200);
    return () => clearTimeout(id);
  }, [unsoldEvent]);

  return {
    state,
    players,
    teams,
    soldEvent,
    unsoldEvent,
    dismissSold: () => setSoldEvent(null),
    dismissUnsold: () => setUnsoldEvent(null),
  };
}