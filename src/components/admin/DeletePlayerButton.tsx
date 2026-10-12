"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminDeletePlayerAction } from "@/lib/actions/player";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

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
  const dialogs = useAppDialogs();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const description =
      playerStatus === "sold"
        ? "This player is currently SOLD. Deleting will refund their price to the team."
        : "This action cannot be undone.";

    const ok = await dialogs.confirm({
      title: `Delete "${playerName}"?`,
      description,
      confirmLabel: "Delete Player",
      tone: "danger",
    });
    if (!ok) return;

    setBusy(true);
    const r = await adminDeletePlayerAction(playerId, tournamentId);
    setBusy(false);

    if (!r.ok) {
      await dialogs.alert({
        title: "Could not delete player",
        description: r.error,
        tone: "danger",
      });
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