import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

export type TournamentPublicData = {
  tournament: Tables<"tournaments">;
  players: Tables<"players">[];
  teams: Tables<"teams">[];
};

export async function getTournamentPublicData(
  slug: string,
): Promise<TournamentPublicData | null> {
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .in("status", ["registration", "ready", "live", "ended", "archived"])
    .maybeSingle();

  if (error || !tournament) return null;

  const [playersRes, teamsRes] = await Promise.all([
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
  ]);

  return {
    tournament,
    players: playersRes.data ?? [],
    teams: teamsRes.data ?? [],
  };
}