import "server-only";

import { createClient } from "@/lib/supabase/server";

export type SiteState = "online" | "maintenance";

/**
 * Reads the global site state. Defaults to "online" if the row is
 * missing or the query fails, so a transient DB issue never locks
 * out the public site.
 */
export async function getSiteState(): Promise<SiteState> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("global_settings")
      .select("site_state")
      .eq("id", "site")
      .maybeSingle();
    if (error || !data) return "online";
    return data.site_state === "maintenance" ? "maintenance" : "online";
  } catch {
    return "online";
  }
}