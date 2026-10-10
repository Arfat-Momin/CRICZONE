"use client";

import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

export type DisplayField = { id: string; label: string };

function getFieldValue(
  player: Tables<"players">,
  fieldId: string,
): string | null {
  switch (fieldId) {
    case "category":
      return player.category ?? null;
    case "currentTeam":
      return player.current_team ?? null;
    case "jerseyNo":
      return player.jersey_no != null ? `#${player.jersey_no}` : null;
    case "jerseySize":
      return player.jersey_size ?? null;
    case "basePrice":
      return player.base_price != null ? `${player.base_price} pts` : null;
    default: {
      const cf = player.custom_fields;
      if (cf && typeof cf === "object" && !Array.isArray(cf)) {
        const v = (cf as Record<string, unknown>)[fieldId];
        if (v == null) return null;
        return String(v);
      }
      return null;
    }
  }
}

export function PlayerCard({
  player,
  displayFields,
  onOpen,
}: {
  player: Tables<"players">;
  displayFields: DisplayField[];
  onOpen: () => void;
}) {
  const photo =
    player.photo_url || "https://placehold.co/200x200/1B4332/FDFCF0?text=%3F";

  const pills = displayFields
    .map((f) => ({ label: f.label, value: getFieldValue(player, f.id) }))
    .filter((x): x is { label: string; value: string } => !!x.value);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center rounded-2xl border border-[#1B4332]/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#2D6A4F]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#2D6A4F]/55">
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold text-forest">
        {player.full_name}
      </p>
      {pills.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-1">
          {pills.map((p) => (
            <span
              key={p.label}
              className="line-clamp-1 rounded-full bg-mint/60 px-2 py-0.5 text-[10px] font-semibold text-forest"
            >
              {p.value}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}