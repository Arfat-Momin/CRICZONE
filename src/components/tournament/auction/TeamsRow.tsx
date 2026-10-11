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

  const statsByTeam = useMemo(() => {
    const map: Record<
      string,
      { bought: Tables<"players">[]; spent: number }
    > = {};
    for (const p of players) {
      if (!p.sold_to_team_id) continue;
      const bucket = (map[p.sold_to_team_id] ??= { bought: [], spent: 0 });
      bucket.bought.push(p);
      bucket.spent += p.selling_price ?? 0;
    }
    return map;
  }, [players]);

  if (teams.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#FFC93C]/20 bg-[#131A33]/60 p-8 text-center text-sm text-[#F0F4FF]/55">
        No teams configured.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teams.map((team) => {
          const bucket = statsByTeam[team.id] ?? { bought: [], spent: 0 };
          const bought = bucket.bought;
          const totalPoints = team.points_remaining + bucket.spent;
          const spentPct =
            totalPoints > 0 ? Math.min(100, (bucket.spent / totalPoints) * 100) : 0;
          const slotsRemaining =
            team.max_players != null
              ? Math.max(0, team.max_players - bought.length)
              : null;
          const initial = (team.team_name[0] ?? "?").toUpperCase();
          const isFull = slotsRemaining !== null && slotsRemaining === 0;

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team)}
              className="group relative flex flex-col overflow-hidden rounded-2xl card-navy p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[#FFC93C]/45 hover:shadow-[0_20px_55px_-20px_rgba(255,201,60,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020]"
            >
              {/* Top-row: logo + name */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-[#FFC93C]/40 bg-[#0B1020]">
                  {team.photo_url ? (
                    <ZoomableImage
                      src={team.photo_url}
                      alt={team.team_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#FFC93C]">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-[#F0F4FF]">
                    {team.team_name}
                  </p>
                  {team.captain_name && (
                    <p className="truncate text-xs text-[#F0F4FF]/50">
                      {team.captain_name}
                    </p>
                  )}
                </div>
                {isFull && (
                  <span className="chip-live shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest">
                    Full
                  </span>
                )}
              </div>

              {/* Points — big gold number */}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#F0F4FF]/40">
                    Points left
                  </p>
                  <motion.p
                    key={String(team.points_remaining)}
                    initial={{ scale: 1.15, color: "#FF4D6D" }}
                    animate={{ scale: 1, color: "#FFC93C" }}
                    transition={{ duration: 0.55 }}
                    className="font-[family-name:var(--font-numeric)] text-3xl font-bold leading-none text-led-gold"
                  >
                    {team.points_remaining}
                  </motion.p>
                </div>
                {slotsRemaining !== null && (
                  <div className="text-right">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#F0F4FF]/40">
                      Slots
                    </p>
                    <p className="font-[family-name:var(--font-numeric)] text-lg font-bold leading-none text-[#F0F4FF]/90">
                      {slotsRemaining}
                      <span className="text-xs text-[#F0F4FF]/45">
                        {" "}
                        / {team.max_players}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Spent progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#0B1020]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-[#FFC93C] to-[#FF4D6D]"
                />
              </div>

              {/* Bought chips */}
              {bought.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {bought.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="truncate rounded-full border border-[#FFC93C]/20 bg-[#FFC93C]/5 px-2 py-0.5 text-[10px] font-semibold text-[#FFE49A]"
                    >
                      {p.full_name}
                    </span>
                  ))}
                  {bought.length > 3 && (
                    <span className="rounded-full border border-[#F0F4FF]/15 bg-[#0B1020] px-2 py-0.5 text-[10px] font-semibold text-[#F0F4FF]/55">
                      +{bought.length - 3}
                    </span>
                  )}
                </div>
              )}

              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#FFC93C]/60 transition group-hover:gap-2 group-hover:text-[#FFC93C]">
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