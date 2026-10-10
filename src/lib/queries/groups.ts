import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

export type GroupWithMembers = Tables<"player_groups"> & {
  player_ids: string[];
};

export const getTournamentGroups = cache(
  async (tournamentId: string): Promise<GroupWithMembers[]> => {
    const supabase = await createClient();

    const { data: groups, error } = await supabase
      .from("player_groups")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !groups || groups.length === 0) return [];

    const { data: members } = await supabase
      .from("player_group_members")
      .select("group_id, player_id")
      .eq("tournament_id", tournamentId);

    const byGroup: Record<string, string[]> = {};
    for (const m of members ?? []) {
      (byGroup[m.group_id] ??= []).push(m.player_id);
    }

    return groups.map((g) => ({
      ...g,
      player_ids: byGroup[g.id] ?? [],
    }));
  },
);