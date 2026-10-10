import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";
import { getTournamentGroups, type GroupWithMembers } from "./groups";

export type AdminTournamentSummary = Pick<
  Tables<"tournaments">,
  | "id"
  | "slug"
  | "name"
  | "venue"
  | "auction_start_at"
  | "status"
  | "registration_enabled"
  | "created_at"
> & {
  player_count: number;
  team_count: number;
};

export async function listAdminTournaments(): Promise<AdminTournamentSummary[]> {
  const supabase = await createClient();

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(
      "id, slug, name, venue, auction_start_at, status, registration_enabled, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !tournaments) {
    console.error("listAdminTournaments failed:", error?.message);
    return [];
  }

  const ids = tournaments.map((t) => t.id);
  if (ids.length === 0) return [];

  const [playersRes, teamsRes] = await Promise.all([
    supabase.from("players").select("tournament_id").in("tournament_id", ids),
    supabase.from("teams").select("tournament_id").in("tournament_id", ids),
  ]);

  const playerCount: Record<string, number> = {};
  const teamCount: Record<string, number> = {};
  for (const p of playersRes.data ?? []) {
    playerCount[p.tournament_id] = (playerCount[p.tournament_id] ?? 0) + 1;
  }
  for (const t of teamsRes.data ?? []) {
    teamCount[t.tournament_id] = (teamCount[t.tournament_id] ?? 0) + 1;
  }

  return tournaments.map((t) => ({
    ...t,
    player_count: playerCount[t.id] ?? 0,
    team_count: teamCount[t.id] ?? 0,
  }));
}

export type AdminTournamentDetail = {
  tournament: Tables<"tournaments">;
  players: Array<Tables<"players"> & { mobile_no: string | null }>;
  teams: Tables<"teams">[];
  state: Tables<"auction_state"> | null;
  groups: GroupWithMembers[];
};

export async function getAdminTournamentDetail(
  id: string,
): Promise<AdminTournamentDetail | null> {
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !tournament) return null;

  const [playersRes, teamsRes, stateRes, groups] = await Promise.all([
    supabase
      .from("players")
      .select("*, player_contacts(mobile_no)")
      .eq("tournament_id", id)
      .order("registered_at", { ascending: false }),
    supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id)
      .order("team_name", { ascending: true }),
    supabase
      .from("auction_state")
      .select("*")
      .eq("tournament_id", id)
      .maybeSingle(),
    getTournamentGroups(id),
  ]);

  type PlayerRow = Tables<"players"> & {
    player_contacts: { mobile_no: string } | { mobile_no: string }[] | null;
  };

  const rawPlayers = (playersRes.data ?? []) as unknown as PlayerRow[];
  const players = rawPlayers.map((p) => {
    const contacts = p.player_contacts;
    let mobile: string | null = null;
    if (Array.isArray(contacts)) mobile = contacts[0]?.mobile_no ?? null;
    else if (contacts) mobile = contacts.mobile_no ?? null;

    const { player_contacts: _unused, ...rest } = p;
    return { ...rest, mobile_no: mobile };
  });

  return {
    tournament,
    players,
    teams: teamsRes.data ?? [],
    state: stateRes.data ?? null,
    groups,
  };
}