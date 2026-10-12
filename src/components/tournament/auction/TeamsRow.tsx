"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import { TeamSquadModal } from "./TeamSquadModal";
import {
  calculateMaxBid,
  formatMaxBid,
  SQUAD_FULL,
} from "@/lib/tournament/max-bid";

type Props = {
  teams: Tables<"teams">[];
  players: Tables<"players">[];
  bidMode: "normal" | "star";
  starBasePrice: number;
};

export function TeamsRow({ teams, players, bidMode, starBasePrice }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<Tables<"teams"> | null>(null);

  const statsByTeam = useMemo(() => {
    const map: Record<string, { bought: Tables<"players">[]; spent: number }> = {};
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
      <p className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-6 text-center text-xs text-cream/55 sm:p-8 sm:text-sm">
        No teams configured.
      </p>
    );
  }

  return (
    <>
      {/* 2 cols on mobile · 2 sm · 3 lg · 4 xl — compact cards below sm */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
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

          const maxBid = calculateMaxBid(
            team.points_remaining,
            slotsRemaining,
            bidMode,
            starBasePrice,
          );
          const maxBidLabel = formatMaxBid(maxBid);
          const isSquadFull = maxBid === SQUAD_FULL;

          const badgeTone = isSquadFull
            ? "border-sold/45 bg-sold/15 text-sold"
            : maxBid === 0
              ? "border-[#FFA000]/45 bg-[#FFA000]/15 text-[#FFA000]"
              : "border-mint/45 bg-mint/10 text-mint";

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team)}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-mint/12 bg-[#0A1410] p-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-mint/40 hover:shadow-[0_16px_40px_-20px_rgba(216,243,220,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08] sm:rounded-2xl sm:p-4 sm:hover:-translate-y-1"
            >
              {/* ── Row 1: logo + name ──────────────────────── */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border-2 border-mint/40 bg-[#050A08] sm:h-12 sm:w-12 sm:rounded-xl">
                  {team.photo_url ? (
                    <ZoomableImage
                      src={team.photo_url}
                      alt={team.team_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-mint sm:text-lg">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-[family-name:var(--font-display)] text-[11px] font-bold leading-tight text-cream sm:truncate sm:text-base sm:text-lg">
                    {team.team_name}
                  </p>
                  {team.captain_name && (
                    <p className="mt-0.5 truncate text-[9px] text-cream/50 sm:text-xs">
                      {team.captain_name}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Row 2: MAX badge ────────────────────────── */}
              <div className="mt-1.5 sm:mt-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs ${badgeTone}`}
                >
                  <span className="font-[family-name:var(--font-numeric)] text-[8px] opacity-70 sm:text-[10px]">
                    MAX
                  </span>
                  <span className="truncate">{maxBidLabel}</span>
                </span>
              </div>

              {/* ── Row 3: points + slots ───────────────────── */}
              <div className="mt-2 flex items-end justify-between gap-2 sm:mt-4 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-cream/40 sm:text-[9px] sm:tracking-[0.24em]">
                    Points
                  </p>
                  <motion.p
                    key={String(team.points_remaining)}
                    initial={{ scale: 1.12, color: "#C1121F" }}
                    animate={{ scale: 1, color: "#D8F3DC" }}
                    transition={{ duration: 0.55 }}
                    className="font-[family-name:var(--font-numeric)] text-base font-bold leading-none sm:text-3xl"
                  >
                    {team.points_remaining}
                  </motion.p>
                </div>
                {slotsRemaining !== null && (
                  <div className="shrink-0 text-right">
                    <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-cream/40 sm:text-[9px] sm:tracking-[0.24em]">
                      Slots
                    </p>
                    <p className="font-[family-name:var(--font-numeric)] text-xs font-bold leading-none text-cream/90 sm:text-lg">
                      {slotsRemaining}
                      <span className="text-[9px] text-cream/45 sm:text-xs">
                        {" "}
                        / {team.max_players}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── Progress bar ────────────────────────────── */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#050A08] sm:mt-3 sm:h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-success to-mint"
                />
              </div>

              {/* ── Bought chips (hidden on mobile, shows on sm+) ── */}
              {bought.length > 0 && (
                <div className="mt-3 hidden flex-wrap gap-1 sm:flex">
                  {bought.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="truncate rounded-full border border-mint/20 bg-mint/5 px-2 py-0.5 text-[10px] font-semibold text-mint/85"
                    >
                      {p.full_name}
                    </span>
                  ))}
                  {bought.length > 3 && (
                    <span className="rounded-full border border-cream/15 bg-[#050A08] px-2 py-0.5 text-[10px] font-semibold text-cream/55">
                      +{bought.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* ── Full badge (tiny, mobile only) ──────────── */}
              {isFull && !isSquadFull && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-sold px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white sm:right-3 sm:top-3 sm:text-[9px]">
                  Full
                </span>
              )}
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