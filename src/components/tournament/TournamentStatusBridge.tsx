"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Watches the `tournaments` row for THIS tournament and refreshes the
 * current route when the status changes (e.g. ended → live).
 *
 * Mount once on the public tournament page. The page is `force-dynamic`
 * so `router.refresh()` re-runs the server render with fresh data.
 */
export function TournamentStatusBridge({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tournament-status-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournamentId, router]);

  return null;
}