"use client";

import { useEffect } from "react";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import type { Tables } from "@/types/supabase";

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

export function PlayerModal({
  player,
  onClose,
}: {
  player: Tables<"players">;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photo =
    player.photo_url || "https://placehold.co/200x200/0A1410/D8F3DC?text=%3F";
  const custom = asRecord(player.custom_fields);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-mint/20 bg-[#0A1410] p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-cream/10 text-lg font-bold text-cream/80 transition hover:bg-sold hover:text-white"
        >
          ×
        </button>

        <span className="inline-block rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint">
          Player Profile
        </span>

        <div className="mx-auto mt-4 h-32 w-32 overflow-hidden rounded-full border-4 border-mint/40 shadow-[0_0_40px_-12px_rgba(216,243,220,0.55)]">
          <ZoomableImage
            src={photo}
            alt={player.full_name}
            className="h-full w-full object-cover object-top"
          />
        </div>

        <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-cream">
          {player.full_name}
        </h2>
        {player.category && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-mint/80">
            {player.category}
          </p>
        )}

        <div className="mt-4 space-y-1 text-left text-sm">
          {player.first_name && <Row label="First Name" value={player.first_name} />}
          {player.surname && <Row label="Surname" value={player.surname} />}
          {player.jersey_no != null && (
            <Row label="Jersey #" value={`#${player.jersey_no}`} />
          )}
          {player.jersey_size && <Row label="Size" value={player.jersey_size} />}
          {player.current_team && (
            <Row label="Current Team" value={player.current_team} />
          )}
          {Object.entries(custom).map(([k, v]) => (
            <Row key={k} label={k.replace(/_/g, " ")} value={String(v)} />
          ))}
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-cream/35">
          Contact info is private
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-mint/10 py-1.5 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-cream/45">
        {label}
      </span>
      <span className="truncate font-semibold text-cream">{value}</span>
    </div>
  );
}