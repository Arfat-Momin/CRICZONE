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
  /** Current auction state — drives max bid calc (mode + star base). */
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
      <p className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-8 text-center text-sm text-cream/55">
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

          // ⭐ Max bid — star/normal aware
          const maxBid = calculateMaxBid(
            team.points_remaining,
            slotsRemaining,
            bidMode,
            starBasePrice,
          );
          const maxBidLabel = formatMaxBid(maxBid);
          const isSquadFull = maxBid === SQUAD_FULL;

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-mint/12 bg-[#0A1410] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-mint/40 hover:shadow-[0_20px_55px_-20px_rgba(216,243,220,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
            >
              {/* ── Row 1: logo + name + MAX BID ────────────────── */}
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-mint/40 bg-[#050A08]">
                  {team.photo_url ? (
                    <ZoomableImage
                      src={team.photo_url}
                      alt={team.team_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-mint">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate font-[family-name:var(--font-display)] text-base font-bold leading-tight text-cream sm:text-lg">
                      {team.team_name}
                    </p>
                    {/* ⭐ MAX BID BADGE */}
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider sm:text-[10px] ${
                        isSquadFull
                          ? "border-sold/40 bg-sold/15 text-sold"
                          : maxBid === 0
                            ? "border-[#FFA000]/40 bg-[#FFA000]/15 text-[#FFA000]"
                            : "border-mint/40 bg-mint/10 text-mint"
                      }`}
                      title={
                        isSquadFull
                          ? "Squad is full — cannot place more bids"
                          : `Maximum this team can bid on the current player (reserves ${bidMode === "star" ? starBasePrice : 1} pt per remaining slot)`
                      }
                    >
                      {isSquadFull
                        ? "Squad Full"
                        : maxBid === 0
                          ? "Max 0"
                          : `Max ${maxBidLabel}`}
                    </span>
                  </div>
                  {team.captain_name && (
                    <p className="mt-0.5 truncate text-xs text-cream/50">
                      {team.captain_name}
                    </p>
                  )}
                </div>

                {isFull && !isSquadFull && (
                  <span className="shrink-0 rounded-full bg-sold px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white">
                    Full
                  </span>
                )}
              </div>

              {/* ── Row 2: points + slots ──────────────────────── */}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-cream/40">
                    Points left
                  </p>
                  <motion.p
                    key={String(team.points_remaining)}
                    initial={{ scale: 1.15, color: "#C1121F" }}
                    animate={{ scale: 1, color: "#D8F3DC" }}
                    transition={{ duration: 0.55 }}
                    className="font-[family-name:var(--font-numeric)] text-3xl font-bold leading-none text-glow-mint"
                  >
                    {team.points_remaining}
                  </motion.p>
                </div>
                {slotsRemaining !== null && (
                  <div className="text-right">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-cream/40">
                      Slots
                    </p>
                    <p className="font-[family-name:var(--font-numeric)] text-lg font-bold leading-none text-cream/90">
                      {slotsRemaining}
                      <span className="text-xs text-cream/45">
                        {" "}
                        / {team.max_players}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── Spent progress bar ─────────────────────────── */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#050A08]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-success to-mint"
                />
              </div>

              {/* ── Bought chips ───────────────────────────────── */}
              {bought.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
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