"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTournamentAction } from "@/lib/actions/tournament";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
}: {
  tournamentId: string;
  tournamentName: string;
}) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const typed = await dialogs.prompt({
      title: "Delete this tournament?",
      description:
        "This permanently removes the tournament, all its players, teams, groups, and history.",
      confirmLabel: "Delete Tournament",
      tone: "danger",
      input: {
        label: `Type the tournament name to confirm`,
        placeholder: tournamentName,
        expectedValue: tournamentName,
      },
    });
    if (typed === null) return;

    setBusy(true);
    const result = await deleteTournamentAction(tournamentId);
    setBusy(false);
    if (!result.ok) {
      await dialogs.alert({
        title: "Could not delete tournament",
        description: result.error,
        tone: "danger",
      });
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="rounded-lg border border-sold/40 bg-sold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete Tournament"}
    </button>
  );
}