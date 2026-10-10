"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminDeletePlayerAction } from "@/lib/actions/player";

export function DeletePlayerButton({
  playerId,
  tournamentId,
  playerName,
  playerStatus,
}: {
  playerId: string;
  tournamentId: string;
  playerName: string;
  playerStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const warn =
      playerStatus === "sold"
        ? `"${playerName}" is SOLD. Deleting will refund their price to the team.\n\nContinue?`
        : `Delete "${playerName}"? This cannot be undone.`;
    if (!confirm(warn)) return;
    setBusy(true);
    const r = await adminDeletePlayerAction(playerId, tournamentId);
    setBusy(false);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="text-xs font-bold text-sold hover:underline disabled:opacity-50"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}