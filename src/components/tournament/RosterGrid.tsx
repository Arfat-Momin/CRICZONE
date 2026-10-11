"use client";

import { useState } from "react";
import type { Tables } from "@/types/supabase";
import { PlayerCard, type DisplayField } from "./PlayerCard";
import { PlayerModal } from "./PlayerModal";

export function RosterGrid({
  players,
  displayFields = [],
}: {
  players: Tables<"players">[];
  displayFields?: DisplayField[];
}) {
  const [selected, setSelected] = useState<Tables<"players"> | null>(null);

  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-10 text-center text-sm text-cream/55">
        No players registered yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            displayFields={displayFields}
            onOpen={() => setSelected(p)}
          />
        ))}
      </div>
      {selected && (
        <PlayerModal player={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}