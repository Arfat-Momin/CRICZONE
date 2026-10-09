"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTeamAction } from "@/lib/actions/team";

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
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${teamName}"? This cannot be undone.`)) return;
    setBusy(true);
    const result = await deleteTeamAction(teamId, tournamentId);
    if (!result.ok) {
      alert(result.error);
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