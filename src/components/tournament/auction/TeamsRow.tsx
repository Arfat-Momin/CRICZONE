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
      <p className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-8 text-center text-sm text-cream/55">
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
              className="group flex flex-col rounded-2xl border border-mint/12 bg-[#0A1410] p-4 text-left shadow-[0_0_30px_-16px_rgba(216,243,220,0.25)] transition hover:-translate-y-0.5 hover:border-mint/35 hover:shadow-[0_0_45px_-14px_rgba(216,243,220,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-mint/35 bg-[#0F231A]">
                  {team.photo_url ? (
                    <ZoomableImage
                      src={team.photo_url}
                      alt={team.team_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-bold text-mint">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-cream">{team.team_name}</p>
                  {team.captain_name && (
                    <p className="truncate text-xs text-cream/55">
                      {team.captain_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between border-t border-mint/10 pt-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-cream/45">
                    Points
                  </p>
                  <motion.p
                    key={String(team.points_remaining)}
                    initial={{ scale: 1.15, color: "#C1121F" }}
                    animate={{ scale: 1, color: "#D8F3DC" }}
                    transition={{ duration: 0.5 }}
                    className="font-[family-name:var(--font-numeric)] text-2xl font-bold"
                  >
                    {team.points_remaining}
                  </motion.p>
                </div>
                {remaining !== null && (
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-cream/45">
                      Slots
                    </p>
                    <p className="font-[family-name:var(--font-numeric)] text-lg font-bold text-cream/90">
                      {remaining}
                      <span className="text-xs text-cream/45">
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
                      className="rounded-full border border-mint/15 bg-mint/5 px-2 py-0.5 text-[10px] font-semibold text-mint/85"
                    >
                      {p.full_name}
                    </span>
                  ))}
                  {bought.length > 4 && (
                    <span className="rounded-full border border-mint/12 bg-mint/5 px-2 py-0.5 text-[10px] font-semibold text-mint/60">
                      +{bought.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-mint/60 transition group-hover:gap-2 group-hover:text-mint">
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