"use client";

import { useState } from "react";
import { ImportFromSeasonModal } from "./ImportFromSeasonModal";

type Props = {
  tournamentId: string;
  auctionUrl: string;
  registerUrl: string;
};

export function TournamentActionsBar({ tournamentId }: Props) {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <section className="mt-10 flex flex-wrap gap-2 rounded-2xl border border-[#1B4332]/10 bg-white p-4 shadow-sm">
        <p className="mr-auto self-center text-xs font-extrabold uppercase tracking-widest text-[#1B4332]/60">
          Quick Actions
        </p>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
        >
          Import from previous season
        </button>
      </section>

      {showImport && (
        <ImportFromSeasonModal
          targetTournamentId={tournamentId}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}