"use client";

import { useState } from "react";

export function ExportPdfButton({ tournamentId }: { tournamentId: string }) {
  const [busy, setBusy] = useState(false);

  function onDownload() {
    setBusy(true);
    try {
      const url = `/api/admin/tournaments/${tournamentId}/export-pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setBusy(false), 1200);
    }
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={busy}
      className="rounded-lg border border-success/40 bg-mint px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-success transition hover:bg-success hover:text-white disabled:opacity-60"
    >
      {busy ? "Preparing PDF…" : "⬇ Export Squads PDF"}
    </button>
  );
}