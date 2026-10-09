"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTournamentAction } from "@/lib/actions/tournament";

export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
}: {
  tournamentId: string;
  tournamentName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const confirmation = prompt(
      `This will permanently delete "${tournamentName}" along with all its teams and players.\n\nType DELETE (all caps) to confirm:`,
    );
    if (confirmation !== "DELETE") return;

    setBusy(true);
    const result = await deleteTournamentAction(tournamentId);
    setBusy(false);
    if (!result.ok) {
      alert(result.error);
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