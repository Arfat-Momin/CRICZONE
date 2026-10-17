"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Invisible component that tracks a viewer's presence in the live auction.
 *
 * Mounts on the public live auction page. Joins a Supabase Presence
 * channel scoped to the tournament. When the user closes the tab,
 * navigates away, or loses connection, Supabase automatically removes
 * them from the channel state.
 */
export function ViewersTracker({ tournamentId }: { tournamentId: string }) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`live-viewers-${tournamentId}`);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          online_at: new Date().toISOString(),
          tab_id: Math.random().toString(36).slice(2, 10),
        });
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  return null;
}