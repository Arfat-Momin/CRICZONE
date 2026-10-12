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
  const starBase = state?.star_base_price ?? 1000;

  // ---- Manual sell state ----
  const [manualTeamId, setManualTeamId] = useState<string | null>(null);
  const [manualPrice, setManualPrice] = useState<string>("");

  useEffect(() => {
    if (highestTeamId && !manualTeamId) setManualTeamId(highestTeamId);
  }, [highestTeamId, manualTeamId]);

  useEffect(() => {
    if (currentBid > 0 && manualPrice.trim() === "") {
      setManualPrice(currentBid.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBid]);

  const highestTeam = useMemo(
    () =>
      highestTeamId ? teams.find((t) => t.id === highestTeamId) ?? null : null,
    [highestTeamId, teams],
  );

  const starConfig = useMemo(
    () => ({
      basePrice: starBase,
      increment: state?.star_increment ?? 1000,
      doubleEnabled: state?.star_double_enabled ?? false,
      doubleAfterBids: state?.star_double_after_bids ?? 10,
      bidCount: state?.star_bid_count ?? 0,
    }),
    [
      starBase,
      state?.star_increment,
      state?.star_double_enabled,
      state?.star_double_after_bids,
      state?.star_bid_count,
    ],
  );

  const nextBidValue = useMemo(
    () => computeNextBid(currentBid, bidMode, starConfig),
    [currentBid, bidMode, starConfig],
  );

  // ============================================================
  // Manual Sell — parse price once, then compute per-team limits
  // ============================================================
  const parsedPrice = useMemo(() => {
    const n = Number.parseFloat(manualPrice);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [manualPrice]);

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

        // Max bid for THIS team (independent of current bid)
        const maxBid = calculateMaxBid(
          t.points_remaining,
          remaining,
          bidMode,
          starBase,
        );
        const maxBidLabel = formatMaxBid(maxBid);
        const isSquadFull = maxBid === SQUAD_FULL;

        // If the entered price is higher than this team can pay → disabled
        const priceTooHigh =
          parsedPrice > 0 && maxBid !== SQUAD_FULL && parsedPrice > maxBid;
        const priceExceedsPoints =
          parsedPrice > 0 && parsedPrice > t.points_remaining;

        const disabled =
          isSquadFull || isFull || cannotAfford || priceTooHigh || priceExceedsPoints;

        // Human-readable reason (for badges)
        let reason: string | null = null;
        if (isSquadFull || isFull) reason = "Squad full";
        else if (cannotAfford) reason = "No points";
        else if (priceTooHigh)
          reason = `Max ${maxBidLabel} < ${parsedPrice}`;
        else if (priceExceedsPoints)
          reason = `Only ${t.points_remaining} pts`;

        return {
          team: t,
          bought,
          remaining,
          maxBid,
          maxBidLabel,
          isSquadFull,
          disabled,
          reason,
        };
      });
  }, [teams, players, bidMode, starBase, parsedPrice]);

  // Selected team's row (for validation display on the Confirm button)
  const selectedRow = useMemo(
    () => teamRows.find((r) => r.team.id === manualTeamId) ?? null,
    [teamRows, manualTeamId],
  );

  // Is the currently-selected combination valid?
  const canConfirmManualSell =
    !!manualTeamId &&
    parsedPrice > 0 &&
    !!selectedRow &&
    !selectedRow.disabled;

  // Auto-clear selection if it becomes invalid (e.g. price changed)
  useEffect(() => {
    if (manualTeamId && selectedRow && selectedRow.disabled) {
      setManualTeamId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow?.disabled]);

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
    // ---- Client-side validation (mirrors the SQL rules) ----
    if (!state?.current_player_id) {
      onMessage("err", "No player on block.");
      return;
    }
    if (!manualTeamId) {
      onMessage("err", "Select a team to sell to.");
      return;
    }
    if (parsedPrice <= 0) {
      onMessage("err", "Enter a valid price greater than 0.");
      return;
    }
    if (!selectedRow) {
      onMessage("err", "Team not found.");
      return;
    }
    if (selectedRow.disabled) {
      onMessage(
        "err",
        selectedRow.reason
          ? `Cannot sell to ${selectedRow.team.team_name}: ${selectedRow.reason}`
          : "Selected team cannot take this bid.",
      );
      return;
    }
    if (parsedPrice > selectedRow.maxBid) {
      // Redundant but explicit
      onMessage(
        "err",
        `Price ${parsedPrice} exceeds ${selectedRow.team.team_name}'s max bid ${selectedRow.maxBidLabel}.`,
      );
      return;
    }
    if (parsedPrice > selectedRow.team.points_remaining) {
      onMessage(
        "err",
        `${selectedRow.team.team_name} only has ${selectedRow.team.points_remaining} pts.`,
      );
      return;
    }

    // ---- Server call (RPC re-validates) ----
    await onBusy(async () => {
      const r = await browserSellPlayer(
        tournamentId,
        state.current_player_id!,
        manualTeamId,
        parsedPrice,
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

        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#1B4332]/55">
          Next bid will be{" "}
          <span className="font-[family-name:var(--font-numeric)] text-forest">
            {nextBidValue} pts
          </span>{" "}
          · {bidMode === "star" ? "Star mode" : "Normal mode"}
        </p>
      </div>

      {/* ============ Team Buttons ============ */}
      <div className="p-5">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/50">
          Tap a team to raise the bid
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
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
              starBase,
            );
            const maxBidLabel = formatMaxBid(maxBid);
            const isSquadFull = maxBid === SQUAD_FULL;

            const cannotAfford = team.points_remaining < nextBidValue;
            const exceedsMax = maxBid !== SQUAD_FULL && nextBidValue > maxBid;
            const wouldHitMaxExactly =
              maxBid !== SQUAD_FULL && nextBidValue === maxBid;

            const isDisabled =
              isHighest || isFull || cannotAfford || exceedsMax;

            if (isHighest) {
              return (
                <div
                  key={team.id}
                  title={`Already highest at ${currentBid} pts — wait for another team to bid, or use "Sell to Highest"`}
                  className="flex flex-col rounded-xl border-2 border-success bg-gradient-to-br from-mint via-mint/80 to-mint/60 p-3.5 text-left"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-forest">
                      {team.team_name}
                    </p>
                    <span className="shrink-0 rounded-full bg-success px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      ✓ Highest
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-forest/75">
                    Bid:{" "}
                    <span className="font-[family-name:var(--font-numeric)] text-success">
                      {currentBid} pts
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-success/45 bg-white/60 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-success">
                      <span className="font-[family-name:var(--font-numeric)] text-[10px] opacity-70">
                        MAX
                      </span>
                      {maxBidLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-success/80">
                    Cannot bid against self
                  </p>
                </div>
              );
            }

            let reasonText: string | null = null;
            let badgeTone = "border-[#2D6A4F]/40 bg-mint/70 text-success";

            if (isSquadFull || isFull) {
              reasonText = "Squad Full — cannot bid";
              badgeTone = "border-sold/45 bg-sold/15 text-sold";
            } else if (cannotAfford) {
              reasonText = `Needs ${nextBidValue} pts · has ${team.points_remaining}`;
              badgeTone = "border-sold/45 bg-sold/15 text-sold";
            } else if (exceedsMax) {
              reasonText = `Max limit ${maxBidLabel} — next bid ${nextBidValue} exceeds it`;
              badgeTone = "border-sold/45 bg-sold/15 text-sold";
            } else if (wouldHitMaxExactly) {
              reasonText = `This will be their final bid (hits max)`;
              badgeTone = "border-[#FFA000]/55 bg-[#FFA000]/15 text-[#B87333]";
            } else if (maxBid === 0) {
              badgeTone = "border-[#FFA000]/45 bg-[#FFA000]/15 text-[#B87333]";
            }

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onPlaceBid(team.id)}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? reasonText ?? "Cannot bid"
                    : `Place bid — ${nextBidValue} pts (max ${maxBidLabel})`
                }
                className="flex flex-col rounded-xl border border-[#1B4332]/15 bg-white p-3.5 text-left transition hover:border-[#2D6A4F]/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-65"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-forest">
                    {team.team_name}
                  </p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-xs ${badgeTone}`}
                  >
                    <span className="font-[family-name:var(--font-numeric)] text-[10px] opacity-70">
                      MAX
                    </span>
                    {isSquadFull ? "0" : maxBidLabel}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[#1B4332]/60">
                  {team.points_remaining} pts
                  {remaining !== null &&
                    ` · ${remaining} slot${remaining === 1 ? "" : "s"}`}
                </p>

                {reasonText && (
                  <p
                    className={`mt-1.5 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      isDisabled
                        ? "bg-sold/10 text-sold"
                        : "bg-[#FFA000]/10 text-[#B87333]"
                    }`}
                  >
                    {reasonText}
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
              Sell the current player at a custom price. Only teams that can
              afford it without breaking their reserve are selectable.
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

          <div className="max-h-72 overflow-y-auto rounded-lg border border-[#1B4332]/15 bg-white">
            {teamRows.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[#1B4332]/50">
                No teams configured.
              </p>
            ) : (
              <ul className="divide-y divide-[#1B4332]/8">
                {teamRows.map((row) => {
                  const {
                    team,
                    remaining,
                    maxBid,
                    maxBidLabel,
                    isSquadFull,
                    disabled,
                    reason,
                  } = row;
                  const selected = team.id === manualTeamId;
                  const isHighestTeam = team.id === highestTeamId;

                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => !disabled && setManualTeamId(team.id)}
                        disabled={disabled}
                        title={
                          disabled
                            ? reason ?? "Cannot sell to this team"
                            : `Sell for ${parsedPrice || "?"} pts`
                        }
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                          disabled
                            ? "cursor-not-allowed opacity-55"
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
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="truncate text-sm font-bold text-forest">
                              {team.team_name}
                            </p>
                            {isHighestTeam && (
                              <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-success">
                                Highest
                              </span>
                            )}
                            <span
                              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                isSquadFull
                                  ? "border-sold/45 bg-sold/15 text-sold"
                                  : disabled && reason?.startsWith("Max")
                                    ? "border-sold/45 bg-sold/15 text-sold"
                                    : "border-[#2D6A4F]/40 bg-mint/70 text-success"
                              }`}
                            >
                              MAX {isSquadFull ? "0" : maxBidLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#1B4332]/55">
                            {team.points_remaining} pts
                            {remaining !== null &&
                              ` · ${remaining} slot${remaining === 1 ? "" : "s"} left`}
                            {team.captain_name && ` · ${team.captain_name}`}
                          </p>
                          {disabled && reason && (
                            <p className="mt-1 inline-block rounded-md bg-sold/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sold">
                              {reason}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Validation summary above Confirm button */}
        {parsedPrice > 0 && manualTeamId && selectedRow && (
          <div className="mt-3 rounded-lg border border-[#1B4332]/12 bg-white px-3 py-2 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-[#1B4332]/60">
              Selling {parsedPrice} pts to {selectedRow.team.team_name}
            </span>
            <span className="ml-2 text-[#1B4332]/45">
              · max for this team: {selectedRow.maxBidLabel}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onManualSell}
          disabled={!canConfirmManualSell}
          className="mt-4 w-full rounded-lg bg-sold px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Manual Sell
        </button>

        {!canConfirmManualSell && manualTeamId && selectedRow?.reason && (
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-sold">
            {selectedRow.reason}
          </p>
        )}
      </div>
    </section>
  );
}