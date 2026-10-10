"use client";

import { useEffect } from "react";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

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
    player.photo_url ||
    "https://placehold.co/200x200/1B4332/FDFCF0?text=%3F";
  const custom = asRecord(player.custom_fields);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F231A]/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border-2 border-mint bg-gradient-to-b from-cream to-white p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
        >
          ×
        </button>

        <span className="inline-block rounded-full bg-forest px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cream">
          Player Profile
        </span>

        <div className="mx-auto mt-4 h-32 w-32 overflow-hidden rounded-full border-4 border-[#2D6A4F] shadow-lg">
          <ZoomableImage
            src={photo}
            alt={player.full_name}
            className="h-full w-full object-cover object-top"
          />
        </div>

        <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-forest">
          {player.full_name}
        </h2>
        {player.category && (
          <p className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F]/80">
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

        <p className="mt-4 text-[10px] uppercase tracking-widest text-[#1B4332]/40">
          Contact info is private
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#1B4332]/10 py-1.5 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/50">
        {label}
      </span>
      <span className="truncate font-semibold text-forest">{value}</span>
    </div>
  );
}