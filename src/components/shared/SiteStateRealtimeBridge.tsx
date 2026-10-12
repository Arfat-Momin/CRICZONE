"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mounts a realtime listener on the `global_settings` row so already-
 * open public tabs refresh the moment the admin toggles maintenance
 * on/off. Without this, viewers need a manual reload.
 *
 * Placed in the root layout so every route picks up the change.
 */
export function SiteStateRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("site-state-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "global_settings",
          filter: "id=eq.site",
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}