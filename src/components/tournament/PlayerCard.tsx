"use client";

import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import {
  getPlayerFieldValue,
  type DisplayField,
} from "@/lib/tournament/player-field-value";

export type { DisplayField };

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
    player.photo_url || "https://placehold.co/200x200/0A1410/D8F3DC?text=%3F";

  const pills = displayFields
    .map((f) => ({
      label: f.label,
      value: getPlayerFieldValue(player, f.id),
    }))
    .filter((x): x is { label: string; value: string } => !!x.value);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center rounded-2xl border border-mint/12 bg-[#0A1410] p-4 text-center shadow-[0_0_30px_-16px_rgba(216,243,220,0.25)] transition duration-300 hover:-translate-y-1 hover:border-mint/35 hover:shadow-[0_0_45px_-14px_rgba(216,243,220,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-mint/35 shadow-[0_0_20px_-6px_rgba(216,243,220,0.45)] transition group-hover:border-mint/70">
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold text-cream">
        {player.full_name}
      </p>
      {pills.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-1">
          {pills.map((p) => (
            <span
              key={p.label}
              className="line-clamp-1 rounded-full border border-mint/12 bg-mint/5 px-2 py-0.5 text-[10px] font-semibold text-mint/85"
            >
              {p.value}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}