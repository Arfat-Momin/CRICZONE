"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import { TeamSquadModal } from "./TeamSquadModal";

export function TeamsRow({
  teams,
  players,
}: {
  teams: Tables<"teams">[];
  players: Tables<"players">[];
}) {
  const [selectedTeam, setSelectedTeam] = useState<Tables<"teams"> | null>(null);

  const boughtByTeam = useMemo(() => {
    const map: Record<string, Tables<"players">[]> = {};
    for (const p of players) {
      if (p.sold_to_team_id) {
        (map[p.sold_to_team_id] ??= []).push(p);
      }
    }
    return map;
  }, [players]);

  if (teams.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-8 text-center text-sm text-[#1B4332]/60">
        No teams configured.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teams.map((team) => {
          const bought = boughtByTeam[team.id] ?? [];
          const remaining =
            team.max_players != null ? Math.max(0, team.max_players - bought.length) : null;
          const initial = (team.team_name[0] ?? "?").toUpperCase();

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team)}
              className="group flex flex-col rounded-2xl border border-[#1B4332]/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#2D6A4F]/40 bg-mint">
                  {team.photo_url ? (
                    <ZoomableImage
                      src={team.photo_url}
                      alt={team.team_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-bold text-forest">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-forest">{team.team_name}</p>
                  {team.captain_name && (
                    <p className="truncate text-xs text-[#1B4332]/60">
                      {team.captain_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between border-t border-[#1B4332]/10 pt-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/50">
                    Points
                  </p>
                  <motion.p
                    key={String(team.points_remaining)}
                    initial={{ scale: 1.15, color: "#C1121F" }}
                    animate={{ scale: 1, color: "#2D6A4F" }}
                    transition={{ duration: 0.5 }}
                    className="font-[family-name:var(--font-numeric)] text-2xl font-bold"
                  >
                    {team.points_remaining}
                  </motion.p>
                </div>
                {remaining !== null && (
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/50">
                      Slots
                    </p>
                    <p className="font-[family-name:var(--font-numeric)] text-lg font-bold text-forest">
                      {remaining}
                      <span className="text-xs text-[#1B4332]/50">
                        {" "}
                        / {team.max_players}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {bought.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {bought.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-forest"
                    >
                      {p.full_name}
                    </span>
                  ))}
                  {bought.length > 4 && (
                    <span className="rounded-full bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1B4332]/70">
                      +{bought.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]/80 transition group-hover:gap-2 group-hover:text-[#2D6A4F]">
                View squad <span aria-hidden>→</span>
              </span>
            </button>
          );
        })}
      </div>

      <TeamSquadModal
        team={selectedTeam}
        players={players}
        onClose={() => setSelectedTeam(null)}
      />
    </>
  );
}