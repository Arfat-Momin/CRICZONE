import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

export type TournamentHeader = Pick<
  Tables<"tournaments">,
  "id" | "name" | "slug" | "status" | "venue" | "poster_url"
>;

/**
 * Cached tournament header — used by the admin shell layout and every
 * page in the (shell) group. React.cache ensures ONE DB round-trip per
 * request even when the layout + page both need it.
 */
export const getTournamentHeader = cache(
  async (tournamentId: string): Promise<TournamentHeader | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, slug, status, venue, poster_url")
      .eq("id", tournamentId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  },
);