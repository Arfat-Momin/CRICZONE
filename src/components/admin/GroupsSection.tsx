"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/supabase";
import { createGroupAction, deleteGroupAction } from "@/lib/actions/group";
import { setGroupingModeAction } from "@/lib/actions/tournament";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };
type Group = Tables<"player_groups"> & { player_ids: string[] };

type Props = {
  tournamentId: string;
  groupingEnabled: boolean;
  players: AdminPlayer[];
  groups: Group[];
};

export function GroupsSection({
  tournamentId,
  groupingEnabled,
  players,
  groups,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState(groupingEnabled);
  const [modePending, startModeTransition] = useTransition();

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Map: playerId -> group name
  const assignment = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) {
      for (const pid of g.player_ids) map[pid] = g.name;
    }
    return map;
  }, [groups]);

  const filteredPlayers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return players
      .filter((p) => p.status === "pending" || p.status === "unsold" || p.status === "on_block")
      .filter((p) => {
        if (!needle) return true;
        const hay = [p.full_name, p.category ?? "", p.current_team ?? ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [players, search]);

  function togglePlayer(id: string) {
    const locked = assignment[id];
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filteredPlayers) {
        if (!assignment[p.id]) next.add(p.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function onCreate() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const playerIds = Array.from(selected);
      const r = await createGroupAction({ tournamentId, name, playerIds });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(`Created "${name}" with ${playerIds.length} player(s).`);
      setName("");
      setSelected(new Set());
      setSearch("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(groupId: string, groupName: string) {
    if (!confirm(`Remove group "${groupName}"? Players will be unassigned.`)) return;
    setBusy(true);
    try {
      const r = await deleteGroupAction(groupId, tournamentId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onToggleMode(next: boolean) {
    setMode(next);
    startModeTransition(async () => {
      const r = await setGroupingModeAction(tournamentId, next);
      if (!r.ok) {
        alert(r.error);
        setMode(groupingEnabled);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
            Player Groups
          </h2>
          <p className="mt-1 text-sm text-[#1B4332]/60">
            Draw players in batches. Each player can belong to at most one group.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#1B4332]/10 bg-white px-4 py-2.5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
              Grouping Mode
            </p>
            <p className="text-[11px] text-[#1B4332]/50">
              {mode ? "Group-wise random on" : "Normal random on"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={mode}
            onClick={() => onToggleMode(!mode)}
            disabled={modePending}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              mode ? "bg-success" : "bg-[#1B4332]/20"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                mode ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left — create form */}
        <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
            Create a Group
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Group Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Group A, Round 1, Stars"
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                disabled={busy}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                  Select Players ({selected.size} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    disabled={busy}
                    className="rounded-md border border-success/40 bg-mint px-2 py-1 text-[10px] font-bold text-success hover:bg-mint/70 disabled:opacity-50"
                  >
                    Select All Filtered
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={busy || selected.size === 0}
                    className="rounded-md border border-sold/40 bg-sold/10 px-2 py-1 text-[10px] font-bold text-sold hover:bg-sold/20 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category…"
                className="mt-2 w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F]"
                disabled={busy}
              />

              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-[#1B4332]/15 bg-[#FAFDF9] p-2">
                {filteredPlayers.length === 0 ? (
                  <p className="p-3 text-center text-xs text-[#1B4332]/50">
                    No matching players.
                  </p>
                ) : (
                  filteredPlayers.map((p) => {
                    const lockedGroup = assignment[p.id];
                    const isSelected = selected.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                          lockedGroup
                            ? "cursor-not-allowed border-[#1B4332]/10 bg-[#1B4332]/5 opacity-60"
                            : isSelected
                              ? "border-success bg-mint"
                              : "border-[#1B4332]/10 bg-white hover:border-[#2D6A4F]/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!!lockedGroup || busy}
                          onChange={() => togglePlayer(p.id)}
                          className="h-3.5 w-3.5 accent-[#1B4332]"
                        />
                        <span className="flex-1 truncate font-semibold text-forest">
                          {p.full_name}
                        </span>
                        {lockedGroup ? (
                          <span className="rounded-full bg-sold/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sold">
                            🚫 {lockedGroup}
                          </span>
                        ) : (
                          p.category && (
                            <span className="text-[10px] text-[#1B4332]/50">
                              {p.category}
                            </span>
                          )
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-success/30 bg-mint px-3 py-2 text-xs font-semibold text-success">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={onCreate}
              disabled={busy || !name.trim() || selected.size === 0}
              className="w-full rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
            >
              {busy ? "Creating…" : "+ Create Group"}
            </button>
          </div>
        </div>

        {/* Right — existing groups */}
        <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
            Existing Groups ({groups.length})
          </h3>

          {groups.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-[#1B4332]/20 bg-[#FAFDF9] p-4 text-center text-xs text-[#1B4332]/60">
              No groups created yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {groups.map((g) => {
                const names = g.player_ids
                  .map((pid) => players.find((p) => p.id === pid)?.full_name)
                  .filter((n): n is string => !!n);
                return (
                  <li
                    key={g.id}
                    className="rounded-xl border border-[#1B4332]/10 bg-[#FAFDF9] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-forest">🏷️ {g.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]/50">
                          {g.player_ids.length} player{g.player_ids.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(g.id, g.name)}
                        disabled={busy}
                        className="whitespace-nowrap text-[11px] font-bold text-sold hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                    {names.length > 0 && (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#1B4332]/60">
                        {names.join(", ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}