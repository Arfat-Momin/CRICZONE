"use client";

import type { Tables } from "@/types/supabase";
import {
  browserPlaceBid,
  browserRevertLastBid,
  browserSellPlayer,
  browserPassPlayer,
  computeNextBid,
} from "@/lib/hooks/useAuctionActions";

type Props = {
  tournamentId: string;
  state: Tables<"auction_state"> | null;
  teams: Tables<"teams">[];
  players: Tables<"players">[];
  onOptimisticBid: (nextBid: number, teamId: string) => void;
  onBidConfirmed: () => void;
  onBusy: (fn: () => Promise<void>) => Promise<void>;
  onMessage: (kind: "ok" | "err", text: string) => void;
};

export function BiddingPad({
  tournamentId,
  state,
  teams,
  players,
  onOptimisticBid,
  onBidConfirmed,
  onBusy,
  onMessage,
}: Props) {
  const currentBid = state?.current_bid_price ?? 0;
  const highestTeamId = state?.current_highest_team_id ?? null;
  const bidMode = state?.bid_mode ?? "normal";

  async function onPlaceBid(teamId: string) {
    // Optimistic: update the UI instantly
    const nextBid = computeNextBid(currentBid, bidMode);
    onOptimisticBid(nextBid, teamId);

    const r = await browserPlaceBid(tournamentId, teamId);
    if (!r.ok) {
      onMessage("err", r.error);
      onBidConfirmed(); // revert — parent will resync from realtime
      return;
    }
    onMessage("ok", `Bid placed — now ${r.data.nextBid} pts.`);
    onBidConfirmed();
  }

  async function onRevertBid() {
    await onBusy(async () => {
      const r = await browserRevertLastBid(tournamentId);
      if (!r.ok) onMessage("err", r.error);
      else onMessage("ok", "Last bid reverted.");
    });
  }

  async function onPass() {
    if (!state?.current_player_id) {
      onMessage("err", "No player on block.");
      return;
    }
    await onBusy(async () => {
      const r = await browserPassPlayer(tournamentId, state.current_player_id!);
      if (!r.ok) onMessage("err", r.error);
      else onMessage("ok", "Player marked unsold.");
    });
  }

  async function onSellToHighest() {
    if (!state?.current_player_id || !highestTeamId || currentBid <= 0) {
      onMessage("err", "No valid bid to sell.");
      return;
    }
    await onBusy(async () => {
      const r = await browserSellPlayer(
        tournamentId,
        state.current_player_id!,
        highestTeamId,
        currentBid,
      );
      if (!r.ok) onMessage("err", r.error);
      else onMessage("ok", "Sold to highest bidder.");
    });
  }

  return (
    <section className="mt-6 rounded-2xl border-2 border-sold/30 bg-gradient-to-b from-[#FFF7F7] to-white p-6 shadow-md">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
        Bidding Pad
      </h2>
      <p className="mt-1 text-sm text-[#1B4332]/75">
        Current bid:{" "}
        <span className="font-[family-name:var(--font-numeric)] text-lg font-bold text-sold">
          {currentBid} pts
        </span>
        {state?.bid_mode === "star" && (
          <span className="ml-2 rounded-full bg-[#7B1FA2] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
            Star Mode
          </span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {teams.map((team) => {
          const boughtCount = players.filter(
            (p) => p.sold_to_team_id === team.id,
          ).length;
          const remaining =
            team.max_players != null ? team.max_players - boughtCount : null;
          const isHighest = team.id === highestTeamId;
          const full = remaining !== null && remaining <= 0;
          const canAfford = team.points_remaining > 0;
          const disabled = isHighest || full || !canAfford;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onPlaceBid(team.id)}
              disabled={disabled}
              className={`rounded-xl border p-3 text-left transition active:scale-[0.97] ${
                isHighest
                  ? "border-success bg-mint"
                  : "border-[#1B4332]/15 bg-white hover:border-[#2D6A4F]/40"
              } disabled:opacity-50`}
            >
              <p className="truncate text-sm font-bold text-forest">
                {team.team_name}
              </p>
              <p className="mt-0.5 text-xs text-[#1B4332]/60">
                {team.points_remaining} pts
                {remaining !== null && ` · ${remaining} slots`}
              </p>
              {isHighest && (
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-success">
                  Highest
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRevertBid}
          className="rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
        >
          Revert Last Bid
        </button>
        <button
          type="button"
          onClick={onSellToHighest}
          disabled={!highestTeamId || currentBid <= 0}
          className="rounded-lg bg-success px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
        >
          Sell to Highest
        </button>
        <button
          type="button"
          onClick={onPass}
          className="rounded-lg border border-sold/40 bg-sold/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white"
        >
          Pass (Unsold)
        </button>
      </div>
    </section>
  );
}