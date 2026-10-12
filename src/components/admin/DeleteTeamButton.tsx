"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTeamAction } from "@/lib/actions/team";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

export function DeleteTeamButton({
  teamId,
  tournamentId,
  teamName,
}: {
  teamId: string;
  tournamentId: string;
  teamName: string;
}) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = await dialogs.confirm({
      title: `Delete "${teamName}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete Team",
      tone: "danger",
    });
    if (!ok) return;

    setBusy(true);
    const result = await deleteTeamAction(teamId, tournamentId);
    if (!result.ok) {
      await dialogs.alert({
        title: "Could not delete team",
        description: result.error,
        tone: "danger",
      });
    } else {
      router.refresh();
    }
    setBusy(false);
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