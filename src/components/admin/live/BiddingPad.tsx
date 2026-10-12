"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";
import {
  browserPlaceBid,
  browserRevertLastBid,
  browserSellPlayer,
  browserPassPlayer,
  computeNextBid,
} from "@/lib/hooks/useAuctionActions";
import {
  calculateMaxBid,
  formatMaxBid,
  SQUAD_FULL,
} from "@/lib/tournament/max-bid";

type Props = {
  tournamentId: string;
  state: Tables<"auction_state"> | null;
  teams: Tables<"teams">[];
  players: Tables<"players">[];
  onBlockPlayerName: string | null;
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
  onBlockPlayerName,
  onOptimisticBid,
  onBidConfirmed,
  onBusy,
  onMessage,
}: Props) {
  const currentBid = state?.current_bid_price ?? 0;
  const highestTeamId = state?.current_highest_team_id ?? null;
  const bidMode = state?.bid_mode ?? "normal";

  // ---- Manual sell state ----
  const [manualTeamId, setManualTeamId] = useState<string | null>(null);
  const [manualPrice, setManualPrice] = useState<string>("");

  // Sync manual team to highest bidder when highest changes (only if none picked)
  useEffect(() => {
    if (highestTeamId && !manualTeamId) {
      setManualTeamId(highestTeamId);
    }
  }, [highestTeamId, manualTeamId]);

  // Pre-fill price with current bid when it changes
  useEffect(() => {
    if (currentBid > 0 && manualPrice.trim() === "") {
      setManualPrice(currentBid.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBid]);

  // Highest team object (for last-bid awareness line)
  const highestTeam = useMemo(
    () =>
      highestTeamId ? teams.find((t) => t.id === highestTeamId) ?? null : null,
    [highestTeamId, teams],
  );

  // Reusable star config passed to computeNextBid
  const starConfig = useMemo(
    () => ({
      basePrice: state?.star_base_price ?? 1000,
      increment: state?.star_increment ?? 1000,
      doubleEnabled: state?.star_double_enabled ?? false,
      doubleAfterBids: state?.star_double_after_bids ?? 10,
      bidCount: state?.star_bid_count ?? 0,
    }),
    [
      state?.star_base_price,
      state?.star_increment,
      state?.star_double_enabled,
      state?.star_double_after_bids,
      state?.star_bid_count,
    ],
  );

  // The bid that would be placed next
  const nextBidValue = useMemo(
    () => computeNextBid(currentBid, bidMode, starConfig),
    [currentBid, bidMode, starConfig],
  );

  // ---- Team rows for the manual sell list ----
  const teamRows = useMemo(() => {
    return teams
      .slice()
      .sort((a, b) => a.team_name.localeCompare(b.team_name))
      .map((t) => {
        const bought = players.filter((p) => p.sold_to_team_id === t.id).length;
        const remaining =
          t.max_players != null ? Math.max(0, t.max_players - bought) : null;
        const isFull = remaining !== null && remaining === 0;
        const cannotAfford = t.points_remaining <= 0;
        const disabled = isFull || cannotAfford;
        return { team: t, bought, remaining, isFull, cannotAfford, disabled };
      });
  }, [teams, players]);

  // ---- Actions ----
  async function onPlaceBid(teamId: string) {
    onOptimisticBid(nextBidValue, teamId);

    const r = await browserPlaceBid(tournamentId, teamId);
    if (!r.ok) {
      onMessage("err", r.error);
      onBidConfirmed();
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

  async function onManualSell() {
    if (!state?.current_player_id) {
      onMessage("err", "No player on block.");
      return;
    }
    if (!manualTeamId) {
      onMessage("err", "Select a team to sell to.");
      return;
    }
    const price = Number.parseFloat(manualPrice);
    if (!Number.isFinite(price) || price <= 0) {
      onMessage("err", "Enter a valid price greater than 0.");
      return;
    }
    await onBusy(async () => {
      const r = await browserSellPlayer(
        tournamentId,
        state.current_player_id!,
        manualTeamId,
        price,
      );
      if (!r.ok) {
        onMessage("err", r.error);
        return;
      }
      onMessage("ok", "Player sold manually.");
      setManualTeamId(null);
      setManualPrice("");
    });
  }

  function useHighestBid() {
    if (!highestTeamId || currentBid <= 0) {
      onMessage("err", "No valid highest bid.");
      return;
    }
    setManualTeamId(highestTeamId);
    setManualPrice(currentBid.toString());
  }

  // ---- Render ----
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border-2 border-sold/25 bg-white shadow-sm">
      {/* ============ Header ============ */}
      <div className="border-b border-[#1B4332]/8 bg-gradient-to-r from-[#FFF7F7] to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Bidding Pad
          </h2>
          <p className="text-sm text-[#1B4332]/75">
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
        </div>

        {/* ⭐ Last-bid awareness strip */}
        {highestTeam && currentBid > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/35 bg-gradient-to-r from-mint/70 to-mint/30 px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-sm text-white shadow-[0_0_18px_-4px_rgba(45,106,79,0.7)]"
                aria-hidden
              >
                ✓
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-success/80">
                  Last bid
                </p>
                <p className="truncate text-sm font-bold text-forest">
                  {highestTeam.team_name}{" "}
                  <span className="font-[family-name:var(--font-numeric)] text-success">
                    · {currentBid} pts
                  </span>
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-success/30 bg-white/60 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-success">
              Cannot bid again
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[#1B4332]/15 bg-[#FAFDF9] px-3.5 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1B4332]/20 text-[11px] text-[#1B4332]/50">
              ?
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1B4332]/55">
              No bids yet — tap any team to open the bidding
            </p>
          </div>
        )}
      </div>

      {/* ============ Team Buttons ============ */}
      <div className="p-5">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/50">
          Tap a team to raise the bid
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {teams.map((team) => {
            const boughtCount = players.filter(
              (p) => p.sold_to_team_id === team.id,
            ).length;
            const remaining =
              team.max_players != null ? team.max_players - boughtCount : null;
            const isHighest = team.id === highestTeamId;
            const isFull = remaining !== null && remaining <= 0;

            const maxBid = calculateMaxBid(
              team.points_remaining,
              remaining,
              bidMode,
              state?.star_base_price ?? 1000,
            );
            const maxBidLabel = formatMaxBid(maxBid);
            const isSquadFull = maxBid === SQUAD_FULL;
            const cannotAfford = team.points_remaining < nextBidValue;
            const exceedsMax = maxBid !== SQUAD_FULL && nextBidValue > maxBid;

            const isDisabled =
              isHighest || isFull || cannotAfford || exceedsMax;

            const tooltip = isHighest
              ? `Already highest at ${currentBid} pts — wait for another team to bid, or use "Sell to Highest"`
              : isFull
                ? "Squad is full"
                : cannotAfford
                  ? `Needs ${nextBidValue} pts (has ${team.points_remaining})`
                  : exceedsMax
                    ? `Next bid ${nextBidValue} exceeds max ${maxBidLabel}`
                    : `Place bid — ${nextBidValue} pts (max ${maxBidLabel})`;

            // Highest bidder — distinctive winning style
            if (isHighest) {
              return (
                <div
                  key={team.id}
                  title={tooltip}
                  className="flex flex-col rounded-xl border-2 border-success bg-gradient-to-br from-mint via-mint/80 to-mint/60 p-3 text-left"
                >
                  <div className="flex w-full items-start justify-between gap-1.5">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-forest">
                      {team.team_name}
                    </p>
                    <span className="shrink-0 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                      ✓ Highest
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-forest/70">
                    Bid:{" "}
                    <span className="font-[family-name:var(--font-numeric)] text-success">
                      {currentBid} pts
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-success/80">
                    Cannot bid against self
                  </p>
                </div>
              );
            }

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onPlaceBid(team.id)}
                disabled={isDisabled}
                title={tooltip}
                className="flex flex-col rounded-xl border border-[#1B4332]/15 bg-white p-3 text-left transition hover:border-[#2D6A4F]/40 active:scale-[0.97] disabled:opacity-50"
              >
                <div className="flex w-full items-start justify-between gap-1.5">
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-forest">
                    {team.team_name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                      isSquadFull
                        ? "border-sold/40 bg-sold/15 text-sold"
                        : maxBid === 0
                          ? "border-[#FFA000]/40 bg-[#FFA000]/15 text-[#B87333]"
                          : "border-[#2D6A4F]/40 bg-mint/70 text-success"
                    }`}
                  >
                    {isSquadFull
                      ? "Full"
                      : maxBid === 0
                        ? "Max 0"
                        : `Max ${maxBidLabel}`}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#1B4332]/60">
                  {team.points_remaining} pts
                  {remaining !== null && ` · ${remaining} slot${remaining === 1 ? "" : "s"}`}
                </p>
                {isFull && !isSquadFull && (
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-sold">
                    Squad Full
                  </p>
                )}
                {!isFull && cannotAfford && (
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-sold">
                    Needs {nextBidValue}
                  </p>
                )}
                {!isFull && !cannotAfford && exceedsMax && (
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-sold">
                    Would exceed max
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Actions ============ */}
      <div className="border-t border-[#1B4332]/8 px-5 py-4">
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* ============ Manual Sell ============ */}
      <div className="border-t-2 border-dashed border-[#1B4332]/12 bg-[#FAFDF9] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold text-forest">
              ✋ Manual Sell
            </h3>
            <p className="mt-0.5 text-xs text-[#1B4332]/60">
              Sell the current player at a custom price to any team.
            </p>
          </div>
          <button
            type="button"
            onClick={useHighestBid}
            disabled={!highestTeamId || currentBid <= 0}
            className="rounded-lg border border-success/40 bg-mint px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-success transition hover:bg-success hover:text-white disabled:opacity-40"
          >
            Use highest bid
          </button>
        </div>

        {onBlockPlayerName && (
          <div className="mt-4 rounded-lg border border-[#1B4332]/12 bg-white px-3 py-2.5 text-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/45">
              Selling
            </span>
            <p className="mt-0.5 font-[family-name:var(--font-display)] text-base font-bold text-forest">
              {onBlockPlayerName}
            </p>
          </div>
        )}

        {/* Price */}
        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
            Price (pts)
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2.5 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
          />
        </div>

        {/* Team list */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
              Select Team
            </label>
            {manualTeamId && (
              <button
                type="button"
                onClick={() => setManualTeamId(null)}
                className="text-[10px] font-bold uppercase tracking-wider text-sold hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-[#1B4332]/15 bg-white">
            {teamRows.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[#1B4332]/50">
                No teams configured.
              </p>
            ) : (
              <ul className="divide-y divide-[#1B4332]/8">
                {teamRows.map(({ team, remaining, isFull, cannotAfford, disabled }) => {
                  const selected = team.id === manualTeamId;
                  const isHighestTeam = team.id === highestTeamId;
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => !disabled && setManualTeamId(team.id)}
                        disabled={disabled}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                          disabled
                            ? "cursor-not-allowed opacity-50"
                            : selected
                              ? "bg-mint"
                              : "hover:bg-[#FAFDF9]"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            selected
                              ? "border-success bg-success"
                              : "border-[#1B4332]/25 bg-white"
                          }`}
                        >
                          {selected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-forest">
                              {team.team_name}
                            </p>
                            {isHighestTeam && (
                              <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-success">
                                Highest
                              </span>
                            )}
                            {isFull && (
                              <span className="shrink-0 rounded-full bg-sold/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sold">
                                Full
                              </span>
                            )}
                            {cannotAfford && !isFull && (
                              <span className="shrink-0 rounded-full bg-sold/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sold">
                                No pts
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#1B4332]/55">
                            {team.points_remaining} pts
                            {remaining !== null &&
                              ` · ${remaining} slot${remaining === 1 ? "" : "s"} left`}
                            {team.captain_name && ` · ${team.captain_name}`}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onManualSell}
          disabled={!manualTeamId || !manualPrice.trim()}
          className="mt-4 w-full rounded-lg bg-sold px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Manual Sell
        </button>
      </div>
    </section>
  );
}