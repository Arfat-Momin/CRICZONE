"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";
import {
  putOnBlockAction,
  finalizeOnBlockAction,
  placeBidAction,
  revertLastBidAction,
  sellPlayerAction,
  passPlayerAction,
} from "@/lib/actions/auction";
import { updateTournamentStatusAction } from "@/lib/actions/tournament";

type Props = {
  tournament: Tables<"tournaments">;
  initialPlayers: Array<Tables<"players"> & { mobile_no: string | null }>;
  initialTeams: Tables<"teams">[];
};

export function LiveControlPanel({
  tournament: initialTournament,
  initialPlayers,
  initialTeams,
}: Props) {
  const [tournament, setTournament] = useState(initialTournament);
  const [players, setPlayers] = useState<Array<Tables<"players"> & { mobile_no: string | null }>>(initialPlayers);
  const [teams, setTeams] = useState<Tables<"teams">[]>(initialTeams);
  const [state, setState] = useState<Tables<"auction_state"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [manualPlayerId, setManualPlayerId] = useState("");
  const [manualTeamId, setManualTeamId] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Realtime: auction_state + players + teams
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-live-${tournament.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "auction_state",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (payload.new) setState(payload.new as Tables<"auction_state">);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const row = payload.new as Tables<"players">;
            setPlayers((prev) => {
              const idx = prev.findIndex((p) => p.id === row.id);
              if (idx >= 0) {
                const copy = prev.slice();
                copy[idx] = { ...copy[idx]!, ...row };
                return copy;
              }
              return [...prev, { ...row, mobile_no: null }];
            });
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<Tables<"players">>;
            if (oldRow.id) setPlayers((prev) => prev.filter((p) => p.id !== oldRow.id));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const row = payload.new as Tables<"teams">;
            setTeams((prev) => {
              const idx = prev.findIndex((t) => t.id === row.id);
              if (idx >= 0) {
                const copy = prev.slice();
                copy[idx] = row;
                return copy;
              }
              return [...prev, row];
            });
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<Tables<"teams">>;
            if (oldRow.id) setTeams((prev) => prev.filter((t) => t.id !== oldRow.id));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournament.id]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function goLive() {
    await withBusy(async () => {
      const r = await updateTournamentStatusAction(tournament.id, "live");
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else {
        setTournament((t) => ({ ...t, status: "live" }));
        setMsg({ kind: "ok", text: "Auction is LIVE." });
      }
    });
  }

  async function endAuction() {
    if (!confirm("End the auction? No more bids can be placed.")) return;
    await withBusy(async () => {
      const r = await updateTournamentStatusAction(tournament.id, "ended");
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else {
        setTournament((t) => ({ ...t, status: "ended" }));
        setMsg({ kind: "ok", text: "Auction ended." });
      }
    });
  }

  async function putRandom(status: "pending" | "unsold") {
    const pool = players.filter((p) => p.status === status);
    if (pool.length === 0) {
      setMsg({ kind: "err", text: `No ${status} players available.` });
      return;
    }
    const winner = pool[Math.floor(Math.random() * pool.length)];
    if (!winner) return;
    await runPutOnBlock(winner.id);
  }

  async function runPutOnBlock(playerId: string) {
    await withBusy(async () => {
      const start = await putOnBlockAction(tournament.id, playerId);
      if (!start.ok) {
        setMsg({ kind: "err", text: start.error });
        return;
      }
      // Let the public shuffle animation play
      await new Promise((r) => setTimeout(r, 3200));
      const fin = await finalizeOnBlockAction(tournament.id, playerId);
      if (!fin.ok) {
        setMsg({ kind: "err", text: fin.error });
        return;
      }
      setMsg({ kind: "ok", text: `${start.data.playerName} is on the block.` });
    });
  }

  async function placeBid(teamId: string) {
    await withBusy(async () => {
      const r = await placeBidAction(tournament.id, teamId);
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else setMsg({ kind: "ok", text: `Bid placed — now ${r.data.nextBid} pts.` });
    });
  }

  async function revertBid() {
    await withBusy(async () => {
      const r = await revertLastBidAction(tournament.id);
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else setMsg({ kind: "ok", text: "Last bid reverted." });
    });
  }

  async function sellManual() {
    const teamId = manualTeamId || state?.current_highest_team_id || "";
    const price = Number.parseFloat(manualPrice) || state?.current_bid_price || 0;
    if (!state?.current_player_id) {
      setMsg({ kind: "err", text: "No player on block." });
      return;
    }
    if (!teamId || price <= 0) {
      setMsg({ kind: "err", text: "Select a team and enter a price." });
      return;
    }
    await withBusy(async () => {
      const r = await sellPlayerAction(tournament.id, state.current_player_id!, teamId, price);
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else {
        setManualPrice("");
        setManualTeamId("");
        setMsg({ kind: "ok", text: "Sold!" });
      }
    });
  }

  async function pass() {
    if (!state?.current_player_id) {
      setMsg({ kind: "err", text: "No player on block." });
      return;
    }
    await withBusy(async () => {
      const r = await passPlayerAction(tournament.id, state.current_player_id!);
      if (!r.ok) setMsg({ kind: "err", text: r.error });
      else setMsg({ kind: "ok", text: "Player marked unsold." });
    });
  }

  const onBlockPlayer = state?.current_player_id
    ? players.find((p) => p.id === state.current_player_id) ?? null
    : null;
  const currentHighestTeam = state?.current_highest_team_id
    ? teams.find((t) => t.id === state.current_highest_team_id) ?? null
    : null;

  const pendingPool = players.filter((p) => p.status === "pending");
  const unsoldPool = players.filter((p) => p.status === "unsold");
  const manualPool = players.filter(
    (p) => p.status === "pending" || p.status === "unsold",
  );

  return (
    <main className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="border-b border-[#1B4332]/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link
            href={`/admin/${tournament.id}`}
            className="text-sm font-bold text-[#2D6A4F] hover:underline"
          >
            &larr; Tournament
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1B4332]/60">
              {tournament.status}
            </span>
            {tournament.status !== "live" && tournament.status !== "ended" && (
              <button
                type="button"
                onClick={goLive}
                disabled={busy}
                className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                Go Live
              </button>
            )}
            {tournament.status === "live" && (
              <button
                type="button"
                onClick={endAuction}
                disabled={busy}
                className="rounded-lg bg-sold px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                End Auction
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-forest">
          {tournament.name} — Live Control
        </h1>

        {msg && (
          <div
            className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold ${
              msg.kind === "ok"
                ? "border-success/30 bg-mint text-success"
                : "border-sold/30 bg-sold/10 text-sold"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* On-block status */}
        <section className="mt-6 rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Current Block
          </h2>
          <div className="mt-3 text-sm text-[#1B4332]/75">
            {state?.shuffling_name ? (
              <p>
                Shuffling:{" "}
                <span className="font-bold text-sold">{state.shuffling_name}</span>
              </p>
            ) : onBlockPlayer ? (
              <p>
                On block:{" "}
                <span className="font-bold text-forest">{onBlockPlayer.full_name}</span> ·{" "}
                Current bid:{" "}
                <span className="font-bold text-sold">{state?.current_bid_price ?? 0} pts</span>{" "}
                {currentHighestTeam && (
                  <>
                    by <span className="font-bold text-[#2D6A4F]">{currentHighestTeam.team_name}</span>
                  </>
                )}
              </p>
            ) : (
              <p className="text-[#1B4332]/60">No player on the block.</p>
            )}
          </div>
        </section>

        {/* Put on block */}
        <section className="mt-6 rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Put Player on Block
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => putRandom("pending")}
              disabled={busy || !!onBlockPlayer || pendingPool.length === 0}
              className="rounded-lg bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
            >
              Random Pending ({pendingPool.length})
            </button>
            <button
              type="button"
              onClick={() => putRandom("unsold")}
              disabled={busy || !!onBlockPlayer || unsoldPool.length === 0}
              className="rounded-lg bg-[#FFA000] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Random Unsold ({unsoldPool.length})
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={manualPlayerId}
              onChange={(e) => setManualPlayerId(e.target.value)}
              disabled={busy || !!onBlockPlayer}
              className="min-w-[220px] rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm"
            >
              <option value="">— Manual select —</option>
              {manualPool.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (manualPlayerId) void runPutOnBlock(manualPlayerId);
              }}
              disabled={busy || !!onBlockPlayer || !manualPlayerId}
              className="rounded-lg bg-[#546E7A] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Put on Block
            </button>
          </div>
        </section>

        {/* Bidding panel */}
        {onBlockPlayer && (
          <section className="mt-6 rounded-2xl border-2 border-sold/30 bg-gradient-to-b from-[#FFF7F7] to-white p-6 shadow-md">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
              Bidding Pad
            </h2>
            <p className="mt-1 text-sm text-[#1B4332]/75">
              Current bid:{" "}
              <span className="font-[family-name:var(--font-numeric)] text-lg font-bold text-sold">
                {state?.current_bid_price ?? 0} pts
              </span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {teams.map((team) => {
                const bought = players.filter((p) => p.sold_to_team_id === team.id);
                const remaining =
                  team.max_players != null ? team.max_players - bought.length : null;
                const isHighest = team.id === state?.current_highest_team_id;
                const full = remaining !== null && remaining <= 0;
                const canAfford = team.points_remaining > 0;
                const disabled = busy || isHighest || full || !canAfford;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => placeBid(team.id)}
                    disabled={disabled}
                    className={`rounded-xl border p-3 text-left transition ${
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

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={revertBid}
                disabled={busy}
                className="rounded-lg border border-[#1B4332]/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint disabled:opacity-50"
              >
                Revert Last Bid
              </button>
              <button
                type="button"
                onClick={pass}
                disabled={busy}
                className="rounded-lg border border-sold/40 bg-sold/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
              >
                Pass (Unsold)
              </button>
            </div>

            <div className="mt-6 border-t border-[#1B4332]/10 pt-5">
              <p className="text-sm font-bold text-forest">Manual Sell</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  value={manualTeamId}
                  onChange={(e) => setManualTeamId(e.target.value)}
                  className="min-w-[180px] rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm"
                >
                  <option value="">
                    {state?.current_highest_team_id
                      ? "— Use highest bidder —"
                      : "— Select team —"}
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} ({t.points_remaining} pts)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.5"
                  min={0.5}
                  placeholder={`Price (e.g. ${state?.current_bid_price ?? 1})`}
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="w-40 rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={sellManual}
                  disabled={busy}
                  className="rounded-lg bg-success px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  Sell Player
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Pools summary */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Pending" value={pendingPool.length} tone="forest" />
          <Stat
            label="Sold"
            value={players.filter((p) => p.status === "sold").length}
            tone="sold"
          />
          <Stat label="Unsold" value={unsoldPool.length} tone="amber" />
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "forest" | "sold" | "amber";
}) {
  const color =
    tone === "sold" ? "text-sold" : tone === "amber" ? "text-[#FFA000]" : "text-forest";
  return (
    <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-numeric)] text-2xl font-bold ${color}`}
      >
        {value}
      </p>
    </div>
  );
}