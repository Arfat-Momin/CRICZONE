"use client";

import type { Tables } from "@/types/supabase";

export function PlayerCard({
  player,
  onOpen,
}: {
  player: Tables<"players">;
  onOpen: () => void;
}) {
  const photo =
    player.photo_url ||
    "https://placehold.co/200x200/1B4332/FDFCF0?text=%3F";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center rounded-2xl border border-[#1B4332]/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#2D6A4F]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#2D6A4F]/55">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={player.full_name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold text-forest">
        {player.full_name}
      </p>
      {player.category && (
        <span className="mt-1 line-clamp-1 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]/80">
          {player.category}
        </span>
      )}
    </button>
  );
}