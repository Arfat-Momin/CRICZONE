"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

type Props = {
  team: Tables<"teams"> | null;
  players: Tables<"players">[];
  onClose: () => void;
};

export function TeamSquadModal({ team, players, onClose }: Props) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!team) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [team, onClose]);

  if (!mounted) return null;

  const open = team !== null;
  const squad = team
    ? players
        .filter((p) => p.sold_to_team_id === team.id)
        .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0))
    : [];

  const totalSpent = squad.reduce((sum, p) => sum + (p.selling_price ?? 0), 0);
  const avgBid = squad.length > 0 ? totalSpent / squad.length : 0;
  const slotsUsed = squad.length;
  const slotsRemaining =
    team && team.max_players != null
      ? Math.max(0, team.max_players - slotsUsed)
      : null;

  const initial = team?.team_name?.[0]?.toUpperCase() ?? "?";
  const photo =
    team?.photo_url ??
    `https://placehold.co/160x160/0A1410/D8F3DC?text=${encodeURIComponent(initial)}`;

  return createPortal(
    <AnimatePresence>
      {open && team && (
        <motion.div
          key="squad-backdrop"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${team.team_name} squad`}
        >
          <motion.div
            key="squad-panel"
            initial={reduce ? false : { scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-mint/20 bg-[#0A1410] shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-xl font-bold text-cream/80 transition hover:bg-sold hover:text-white"
            >
              ×
            </button>

            <div className="border-b border-mint/10 bg-gradient-to-b from-mint/10 to-transparent px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-mint/40 bg-[#0F231A] shadow-md">
                  <ZoomableImage
                    src={photo}
                    alt={team.team_name}
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 pr-8">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint/70">
                    Team Squad
                  </p>
                  <h2 className="mt-0.5 truncate font-[family-name:var(--font-display)] text-2xl font-bold text-cream">
                    {team.team_name}
                  </h2>
                  {team.captain_name && (
                    <p className="mt-0.5 truncate text-sm text-cream/55">
                      Captain: {team.captain_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label="Points Left" value={`${team.points_remaining}`} tone="success" />
                <Stat
                  label="Slots"
                  value={
                    team.max_players != null
                      ? `${slotsUsed}/${team.max_players}`
                      : `${slotsUsed}`
                  }
                  tone="forest"
                />
                <Stat label="Spent" value={`${totalSpent}`} tone="sold" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {squad.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-mint/20 bg-[#050A08] p-8 text-center">
                  <p className="text-3xl" aria-hidden>
                    🏏
                  </p>
                  <p className="mt-2 text-sm font-semibold text-cream/70">
                    No players purchased yet
                  </p>
                  <p className="mt-1 text-xs text-cream/45">
                    Squad will appear here as bids are won.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.24em] text-cream/45">
                    <span>{squad.length} Player{squad.length === 1 ? "" : "s"}</span>
                    {squad.length > 1 && <span>Avg {avgBid.toFixed(1)} pts</span>}
                  </div>

                  <ul className="space-y-2">
                    {squad.map((p, idx) => {
                      const pPhoto =
                        p.photo_url ??
                        "https://placehold.co/120x120/0A1410/D8F3DC?text=%3F";
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 rounded-2xl border border-mint/12 bg-[#050A08] p-3 transition hover:border-mint/30"
                        >
                          <span className="w-5 shrink-0 text-center font-[family-name:var(--font-numeric)] text-xs font-bold text-cream/35">
                            {idx + 1}
                          </span>

                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-mint/35">
                            <ZoomableImage
                              src={pPhoto}
                              alt={p.full_name}
                              loading="lazy"
                              className="h-full w-full object-cover object-top"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-cream">
                              {p.full_name}
                            </p>
                            <p className="truncate text-[11px] text-cream/50">
                              {[p.category, p.jersey_no ? `#${p.jersey_no}` : null]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-[family-name:var(--font-numeric)] text-lg font-bold leading-none text-sold">
                              {p.selling_price ?? 0}
                            </p>
                            <p className="text-[9px] font-extrabold uppercase tracking-wider text-cream/35">
                              pts
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {slotsRemaining !== null && slotsRemaining === 0 && (
                    <p className="mt-4 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-sold">
                      Squad Full
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "forest" | "sold";
}) {
  const color =
    tone === "success"
      ? "text-mint"
      : tone === "sold"
        ? "text-sold"
        : "text-cream";
  return (
    <div className="rounded-xl border border-mint/12 bg-[#050A08] px-2 py-2 text-center">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-cream/45">
        {label}
      </p>
      <p
        className={`mt-0.5 font-[family-name:var(--font-numeric)] text-base font-bold ${color}`}
      >
        {value}
      </p>
    </div>
  );
}