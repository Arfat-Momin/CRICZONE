"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";
import type { GroupWithMembers } from "@/lib/queries/groups";
import {
  clearOnBlockAction,
  setBidModeAction,
} from "@/lib/actions/auction";
import {
  browserStartShuffle,
  browserFinalizeOnBlock,
} from "@/lib/hooks/useAuctionActions";
import { updateTournamentStatusAction } from "@/lib/actions/tournament";
import { BiddingPad } from "./BiddingPad";
import { GroupDrawButtons } from "./GroupDrawButtons";
import { SoldPlayersList } from "./SoldPlayersList";
import { SearchCombobox, type ComboboxOption } from "./SearchCombobox";
import { BlockDisplayFieldsModal } from "./BlockDisplayFieldsModal";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };

type Props = {
  tournament: Tables<"tournaments">;
  initialState: Tables<"auction_state"> | null;
  initialPlayers: AdminPlayer[];
  initialTeams: Tables<"teams">[];
  initialGroups: GroupWithMembers[];
};

const SHUFFLE_DURATION_MS = 3000;

export function LiveControlPanel({
  tournament: initialTournament,
  initialState,
  initialPlayers,
  initialTeams,
  initialGroups,
}: Props) {
  const router = useRouter();
  const [tournament, setTournament] = useState(initialTournament);
  const [players, setPlayers] = useState<AdminPlayer[]>(initialPlayers);
  const [teams, setTeams] = useState<Tables<"teams">[]>(initialTeams);
  const [groups, setGroups] = useState<GroupWithMembers[]>(initialGroups);
  const [state, setState] = useState<Tables<"auction_state"> | null>(initialState);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [manualPlayerId, setManualPlayerId] = useState<string | null>(null);
  const [showDisplayModal, setShowDisplayModal] = useState(false);

  const formConfig = useMemo(
    () => normalizeFormConfig(tournament.form_config, tournament.name),
    [tournament.form_config, tournament.name],
  );

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ REALTIME ============
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
            if (oldRow.id)
              setPlayers((prev) => prev.filter((p) => p.id !== oldRow.id));
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
            if (oldRow.id)
              setTeams((prev) => prev.filter((t) => t.id !== oldRow.id));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournament.id]);

  function onMessage(kind: "ok" | "err", text: string) {
    setMsg({ kind, text });
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  // ============ AUCTION STATE ============
  async function goLive() {
    await withBusy(async () => {
      const r = await updateTournamentStatusAction(tournament.id, "live");
      if (!r.ok) onMessage("err", r.error);
      else {
        setTournament((t) => ({ ...t, status: "live" }));
        onMessage("ok", "Auction is LIVE.");
      }
    });
  }

  async function endAuction() {
    if (!confirm("End the auction? No more bids can be placed.")) return;
    await withBusy(async () => {
      const r = await updateTournamentStatusAction(tournament.id, "ended");
      if (!r.ok) onMessage("err", r.error);
      else {
        setTournament((t) => ({ ...t, status: "ended" }));
        onMessage("ok", "Auction ended.");
      }
    });
  }

  // ============ PUT ON BLOCK ============
  async function runPutOnBlock(playerId: string) {
    const player = players.find((p) => p.id === playerId);
    if (!player) {
      onMessage("err", "Player not found.");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const start = await browserStartShuffle(tournament.id, player.full_name);
      if (!start.ok) {
        onMessage("err", start.error);
        return;
      }

      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, SHUFFLE_DURATION_MS),
      );

      const fin = await browserFinalizeOnBlock(tournament.id, playerId);
      if (!fin.ok) {
        onMessage("err", fin.error);
        return;
      }

      setManualPlayerId(null);
      onMessage("ok", `${player.full_name} is on the block.`);
    } catch (e) {
      onMessage("err", e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  async function drawRandom(pool: AdminPlayer[], label: string) {
    if (pool.length === 0) {
      onMessage("err", `No ${label} players available.`);
      return;
    }
    const winner = pool[Math.floor(Math.random() * pool.length)];
    if (!winner) return;
    await runPutOnBlock(winner.id);
  }

  async function onDrawOutsideGroups() {
    const allGroupPlayerIds = new Set<string>();
    for (const g of groups) for (const pid of g.player_ids) allGroupPlayerIds.add(pid);
    const pool = players.filter(
      (p) => p.status === "pending" && !allGroupPlayerIds.has(p.id),
    );
    await drawRandom(pool, "outside-group");
  }

  async function onClearBlock() {
    if (
      !confirm(
        "Clear the current block?\n\nAny on-block player will return to Pending and bid history will be cleared.",
      )
    ) {
      return;
    }
    await withBusy(async () => {
      const r = await clearOnBlockAction(tournament.id);
      if (!r.ok) onMessage("err", r.error);
      else onMessage("ok", "Block cleared.");
    });
  }

  async function onToggleBidMode() {
    const next = state?.bid_mode === "star" ? "normal" : "star";
    await withBusy(async () => {
      const r = await setBidModeAction(tournament.id, next);
      if (!r.ok) onMessage("err", r.error);
      else
        onMessage(
          "ok",
          `Bid mode set to ${next === "star" ? "STAR (1000 pts)" : "NORMAL"}.`,
        );
    });
  }

  // ============ DERIVED ============
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

  // Combobox options for manual override — sorted alphabetically
  const manualOptions: ComboboxOption[] = useMemo(() => {
    return manualPool
      .slice()
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((p) => ({
        id: p.id,
        label: p.full_name,
        meta: [p.category, p.status, p.current_team]
          .filter(Boolean)
          .join(" · "),
      }));
  }, [manualPool]);

  const isShuffling = !!state?.shuffling_name;
  const blockLocked = !!onBlockPlayer || isShuffling;

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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDisplayModal(true)}
              disabled={busy}
              className="rounded-lg border border-success/40 bg-mint px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-success transition hover:bg-success hover:text-white disabled:opacity-50"
              title="Configure which fields show on the on-block card"
            >
              ⚙ Display Fields
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              disabled={busy}
              className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint disabled:opacity-50"
            >
              Refresh
            </button>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-[#1B4332]/60 sm:inline">
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

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            {/* ============ CURRENT BLOCK ============ */}
            <section className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
                  Current Block
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onToggleBidMode}
                    disabled={busy}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                      state?.bid_mode === "star"
                        ? "border-[#7B1FA2] bg-[#7B1FA2] text-white"
                        : "border-[#1B4332]/20 bg-white text-forest hover:bg-mint"
                    } disabled:opacity-50`}
                  >
                    {state?.bid_mode === "star" ? "★ Star Mode ON" : "Star Mode OFF"}
                  </button>
                  {blockLocked && (
                    <button
                      type="button"
                      onClick={onClearBlock}
                      disabled={busy}
                      className="rounded-lg border border-sold/40 bg-sold/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
                    >
                      Clear Block
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm text-[#1B4332]/75">
                {isShuffling ? (
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sold" />
                    Shuffling:{" "}
                    <span className="font-bold text-sold">
                      {state?.shuffling_name}
                    </span>
                    <span className="text-xs text-[#1B4332]/50">
                      (3s draw in progress…)
                    </span>
                  </p>
                ) : onBlockPlayer ? (
                  <>
                    <p>
                      On block:{" "}
                      <span className="font-bold text-forest">
                        {onBlockPlayer.full_name}
                      </span>
                    </p>
                    <p className="mt-1">
                      Current bid:{" "}
                      <span className="font-[family-name:var(--font-numeric)] font-bold text-sold">
                        {state?.current_bid_price ?? 0} pts
                      </span>
                      {currentHighestTeam && (
                        <>
                          {" "}
                          by{" "}
                          <span className="font-bold text-[#2D6A4F]">
                            {currentHighestTeam.team_name}
                          </span>
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-[#1B4332]/60">No player on the block.</p>
                )}
              </div>
            </section>

            {/* ============ PUT ON BLOCK ============ */}
            <section className="mt-6 rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
                Put Player on Block
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => drawRandom(pendingPool, "pending")}
                  disabled={busy || blockLocked || pendingPool.length === 0}
                  className="rounded-lg bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  Random Pending ({pendingPool.length})
                </button>
                <button
                  type="button"
                  onClick={() => drawRandom(unsoldPool, "unsold")}
                  disabled={busy || blockLocked || unsoldPool.length === 0}
                  className="rounded-lg bg-[#FFA000] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  Random Unsold ({unsoldPool.length})
                </button>
              </div>

              {tournament.grouping_enabled && (
                <GroupDrawButtons
                  groups={groups}
                  players={players}
                  disabled={busy || blockLocked}
                  onDrawFromGroup={async (g) => {
                    const pool = players.filter(
                      (p) => p.status === "pending" && g.player_ids.includes(p.id),
                    );
                    await drawRandom(pool, `"${g.name}"`);
                  }}
                  onDrawOutside={onDrawOutsideGroups}
                />
              )}

              {/* ============ MANUAL OVERRIDE (search) ============ */}
              <div className="mt-5 rounded-xl border border-[#1B4332]/12 bg-[#FAFDF9] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
                      🔍 Manual Override
                    </p>
                    <p className="mt-0.5 text-xs text-[#1B4332]/55">
                      Search any pending or unsold player to put on block.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
                    {manualPool.length} available
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <SearchCombobox
                    options={manualOptions}
                    value={manualPlayerId}
                    onChange={setManualPlayerId}
                    placeholder="Search player by name, category, status…"
                    searchPlaceholder="Type to filter…"
                    emptyMessage="No players match"
                    clearable
                    disabled={busy || blockLocked}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manualPlayerId) void runPutOnBlock(manualPlayerId);
                    }}
                    disabled={busy || blockLocked || !manualPlayerId}
                    className="rounded-lg bg-[#546E7A] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    Put on Block
                  </button>
                </div>
              </div>
            </section>

            {/* ============ BIDDING PAD + MANUAL SELL ============ */}
            {onBlockPlayer && (
              <BiddingPad
                tournamentId={tournament.id}
                state={state}
                teams={teams}
                players={players}
                onBlockPlayerName={onBlockPlayer.full_name}
                onOptimisticBid={(nextBid, teamId) => {
                  setState((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      current_bid_price: nextBid,
                      current_highest_team_id: teamId,
                    };
                  });
                }}
                onBidConfirmed={() => {
                  // Realtime handles the authoritative state
                }}
                onBusy={withBusy}
                onMessage={onMessage}
              />
            )}
          </div>

          <div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Pending" value={pendingPool.length} tone="forest" />
              <Stat
                label="Sold"
                value={players.filter((p) => p.status === "sold").length}
                tone="sold"
              />
              <Stat label="Unsold" value={unsoldPool.length} tone="amber" />
            </div>

            <SoldPlayersList
              tournamentId={tournament.id}
              players={players}
              teams={teams}
              onBusy={withBusy}
              onMessage={onMessage}
            />
          </div>
        </div>
      </div>

      {showDisplayModal && (
        <BlockDisplayFieldsModal
          tournamentId={tournament.id}
          initialConfig={formConfig}
          onClose={() => setShowDisplayModal(false)}
        />
      )}
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
    tone === "sold"
      ? "text-sold"
      : tone === "amber"
        ? "text-[#FFA000]"
        : "text-forest";
  return (
    <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4 text-center">
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