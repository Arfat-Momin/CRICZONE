"use client";

import { useState } from "react";
import type { Tables } from "@/types/supabase";
import { PlayerTableWithSearch } from "./PlayerTableWithSearch";
import { CreatePlayerForm } from "./CreatePlayerForm";
import { BulkImportModal } from "./BulkImportModal";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };

export function AdminPlayerSection({
  players,
  tournamentId,
}: {
  players: AdminPlayer[];
  tournamentId: string;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
            Players ({players.length})
          </h2>
          <p className="mt-1 text-sm text-[#1B4332]/60">
            Add manually, import from CSV, or share the public registration link.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
          >
            Bulk Import CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream transition hover:bg-[#2D6A4F]"
          >
            + Add Player
          </button>
        </div>
      </div>

      <div className="mt-6">
        <PlayerTableWithSearch players={players} tournamentId={tournamentId} />
      </div>

      {showCreate && (
        <div
          onClick={() => setShowCreate(false)}
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#0F231A]/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-8 w-full max-w-xl rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
                Add Player
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <CreatePlayerForm
                tournamentId={tournamentId}
                onSuccess={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <BulkImportModal
          tournamentId={tournamentId}
          onClose={() => setShowImport(false)}
        />
      )}
    </section>
  );
}