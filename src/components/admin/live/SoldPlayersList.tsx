"use client";

import { useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";
import { browserRevertSale } from "@/lib/hooks/useAuctionActions";

type Props = {
  tournamentId: string;
  players: Tables<"players">[];
  teams: Tables<"teams">[];
  onBusy: (fn: () => Promise<void>) => Promise<void>;
  onMessage: (kind: "ok" | "err", text: string) => void;
};

export function SoldPlayersList({
  tournamentId,
  players,
  teams,
  onBusy,
  onMessage,
}: Props) {
  const [search, setSearch] = useState("");

  const teamsById = useMemo(() => {
    const m: Record<string, Tables<"teams">> = {};
    for (const t of teams) m[t.id] = t;
    return m;
  }, [teams]);

  const allSold = useMemo(
    () =>
      players
        .filter((p) => p.status === "sold")
        .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0)),
    [players],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSold;
    return allSold.filter((p) => {
      const team = p.sold_to_team_id ? teamsById[p.sold_to_team_id] : null;
      const haystack = [
        p.full_name,
        team?.team_name ?? "",
        String(p.selling_price ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allSold, search, teamsById]);

  async function onRevert(playerId: string, playerName: string) {
    if (
      !confirm(
        `Revert the sale of "${playerName}"?\n\nThe team will be refunded and the player will return to Pending.`,
      )
    ) {
      return;
    }
    await onBusy(async () => {
      const r = await browserRevertSale(tournamentId, playerId);
      if (!r.ok) onMessage("err", r.error);
      else onMessage("ok", `Reverted sale of ${playerName}.`);
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Sold Players ({allSold.length})
          </h2>
          <p className="mt-0.5 text-xs text-[#1B4332]/60">
            Search any sold player to revert their sale.
          </p>
        </div>
        {search && (
          <span className="shrink-0 rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
            {filtered.length} of {allSold.length}
          </span>
        )}
      </div>

      {/* Search bar */}
      {allSold.length > 0 && (
        <div className="mt-4">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#1B4332]/40"
            >
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player, team, or price…"
              className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] py-2 pl-9 pr-9 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#1B4332]/50 transition hover:bg-sold/10 hover:text-sold"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {allSold.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#1B4332]/20 bg-[#FAFDF9] p-6 text-center text-xs text-[#1B4332]/55">
          No players sold yet.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#1B4332]/20 bg-[#FAFDF9] p-6 text-center text-xs text-[#1B4332]/55">
          No sold players match your search.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((p) => {
            const team = p.sold_to_team_id ? teamsById[p.sold_to_team_id] : undefined;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#1B4332]/10 bg-[#FAFDF9] p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {p.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_url}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded-full border border-[#1B4332]/15 object-cover object-top"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[#1B4332]/10" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-forest">
                      {p.full_name}
                    </p>
                    <p className="truncate text-xs text-[#1B4332]/60">
                      {team?.team_name ?? "—"} · {p.selling_price ?? 0} pts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRevert(p.id, p.full_name)}
                  className="whitespace-nowrap rounded-lg border border-sold/40 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white"
                >
                  Revert
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}