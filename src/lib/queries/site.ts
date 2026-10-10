import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteState = "online" | "maintenance";

export const getSiteState = cache(async (): Promise<SiteState> => {
  try {
    const supabase = createPublicClient();
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
});