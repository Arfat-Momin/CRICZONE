import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/supabase";

export type TournamentPublicData = {
  tournament: Tables<"tournaments">;
  players: Tables<"players">[];
  teams: Tables<"teams">[];
  state: Tables<"auction_state"> | null;
};

/**
 * Public tournament read — cookie-less, cacheable, ISR-friendly.
 * Cached per-request via React.cache() and per-slug across requests via ISR.
 */
export const getTournamentPublicData = cache(
  async (slug: string): Promise<TournamentPublicData | null> => {
    const supabase = createPublicClient();

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .in("status", ["registration", "ready", "live", "ended", "archived"])
      .maybeSingle();

    if (error || !tournament) return null;

    const [playersRes, teamsRes, stateRes] = await Promise.all([
      supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("full_name", { ascending: true }),
      supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("team_name", { ascending: true }),
      supabase
        .from("auction_state")
        .select("*")
        .eq("tournament_id", tournament.id)
        .maybeSingle(),
    ]);

    return {
      tournament,
      players: playersRes.data ?? [],
      teams: teamsRes.data ?? [],
      state: stateRes.data ?? null,
    };
  },
);