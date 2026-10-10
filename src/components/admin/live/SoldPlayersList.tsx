"use client";

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
  const teamsById: Record<string, Tables<"teams">> = {};
  for (const t of teams) teamsById[t.id] = t;

  const sold = players
    .filter((p) => p.status === "sold")
    .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0));

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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Sold Players ({sold.length})
          </h2>
          <p className="mt-0.5 text-xs text-[#1B4332]/60">
            Revert any sale — the team is refunded and the player returns to Pending.
          </p>
        </div>
      </div>

      {sold.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#1B4332]/20 bg-[#FAFDF9] p-6 text-center text-xs text-[#1B4332]/55">
          No players sold yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {sold.map((p) => {
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
                      className="h-9 w-9 rounded-full border border-[#1B4332]/15 object-cover object-top"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#1B4332]/10" />
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