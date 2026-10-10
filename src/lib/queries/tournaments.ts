import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Tournament } from "@/types/supabase";

export type PublicTournament = Pick<
  Tournament,
  "id" | "slug" | "name" | "venue" | "auction_start_at" | "status"
>;

const PUBLIC_COLUMNS = "id, slug, name, venue, auction_start_at, status" as const;

export async function getActiveTournaments(limit = 12): Promise<PublicTournament[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(PUBLIC_COLUMNS)
    .in("status", ["registration", "ready", "live"])
    .order("auction_start_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("getActiveTournaments failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getArchivedTournaments(limit = 8): Promise<PublicTournament[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(PUBLIC_COLUMNS)
    .eq("status", "archived")
    .order("auction_start_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("getArchivedTournaments failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTournamentBySlug(slug: string): Promise<PublicTournament | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .in("status", ["registration", "ready", "live", "ended", "archived"])
    .maybeSingle();

  if (error) {
    console.error("getTournamentBySlug failed:", error.message);
    return null;
  }
  return data;
}