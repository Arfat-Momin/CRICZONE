"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/supabase";
import { adminDeletePlayerAction } from "@/lib/actions/player";
import { deleteTeamAction } from "@/lib/actions/team";
import {
  clearTournamentDataAction,
  deleteTournamentAction,
} from "@/lib/actions/tournament";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };

type Props = {
  tournamentId: string;
  tournamentName: string;
  players: AdminPlayer[];
  teams: Tables<"teams">[];
};

export function DangerZone({
  tournamentId,
  tournamentName,
  players,
  teams,
}: Props) {
  const router = useRouter();
  const dialogs = useAppDialogs();

  // ---------- Clear data ----------
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearText, setClearText] = useState("");
  const [clearing, setClearing] = useState(false);

  // ---------- Delete tournament ----------
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ---------- Delete player ----------
  const [playerQuery, setPlayerQuery] = useState("");
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  // ---------- Delete team ----------
  const [teamQuery, setTeamQuery] = useState("");
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // ---------- Shared message ----------
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  // ==================== PLAYER FILTER ====================
  const filteredPlayers = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      const teamName = p.sold_to_team_id
        ? teams.find((t) => t.id === p.sold_to_team_id)?.team_name ?? ""
        : "";
      const haystack = [
        p.full_name,
        p.first_name ?? "",
        p.surname ?? "",
        p.category ?? "",
        p.status,
        p.current_team ?? "",
        p.jersey_no != null ? `#${p.jersey_no}` : "",
        p.mobile_no ?? "",
        teamName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [players, playerQuery, teams]);

  // ==================== TEAM FILTER ====================
  const filteredTeams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => {
      const haystack = [t.team_name, t.captain_name ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, teamQuery]);

  // ==================== ACTIONS ====================
  async function onClearAll() {
    if (clearText !== "CLEAR") return;
    setClearing(true);
    setMsg(null);
    try {
      const r = await clearTournamentDataAction(tournamentId);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({
        kind: "ok",
        text: `Cleared ${r.data.deleted} player${r.data.deleted === 1 ? "" : "s"} and all teams/groups.`,
      });
      setConfirmClear(false);
      setClearText("");
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  async function onDeleteTournament() {
    if (deleteText !== tournamentName) return;
    setDeleting(true);
    setMsg(null);
    try {
      const r = await deleteTournamentAction(tournamentId);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function onDeletePlayer(player: AdminPlayer) {
    const teamName = player.sold_to_team_id
      ? teams.find((t) => t.id === player.sold_to_team_id)?.team_name
      : null;

    const descLines: string[] = [];
    if (player.status === "sold" && teamName && (player.selling_price ?? 0) > 0) {
      descLines.push(
        `⚠️ This player was SOLD to ${teamName} for ${player.selling_price} pts.`,
      );
      descLines.push(`The team will be refunded ${player.selling_price} pts.`);
    }
    if (player.status === "on_block") {
      descLines.push(`⚠️ This player is currently ON THE BLOCK.`);
      descLines.push(`The current block will be cleared.`);
    }
    if (descLines.length > 0) descLines.push("");
    descLines.push("This cannot be undone.");

    const ok = await dialogs.confirm({
      title: `Delete "${player.full_name}"?`,
      description: descLines.join("\n"),
      confirmLabel: "Delete Player",
      tone: "danger",
    });
    if (!ok) return;

    setDeletingPlayerId(player.id);
    setMsg(null);
    try {
      const r = await adminDeletePlayerAction(player.id, tournamentId);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({ kind: "ok", text: `Deleted "${player.full_name}".` });
      router.refresh();
    } finally {
      setDeletingPlayerId(null);
    }
  }

  async function onDeleteTeam(team: Tables<"teams">) {
    const bought = players.filter((p) => p.sold_to_team_id === team.id);

    const descLines: string[] = [];
    if (bought.length > 0) {
      descLines.push(
        `⚠️ This team has bought ${bought.length} player${bought.length === 1 ? "" : "s"}.`,
      );
      descLines.push(
        `They will return to Pending status (removed from this team).`,
      );
      descLines.push("");
    }
    descLines.push("This cannot be undone.");

    const ok = await dialogs.confirm({
      title: `Delete team "${team.team_name}"?`,
      description: descLines.join("\n"),
      confirmLabel: "Delete Team",
      tone: "danger",
    });
    if (!ok) return;

    setDeletingTeamId(team.id);
    setMsg(null);
    try {
      const r = await deleteTeamAction(team.id, tournamentId);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({ kind: "ok", text: `Deleted team "${team.team_name}".` });
      router.refresh();
    } finally {
      setDeletingTeamId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Global header */}
      <div className="rounded-2xl border-2 border-sold/30 bg-[#FFF7F7] p-5 sm:p-6">
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-sold sm:text-3xl">
          ⚠️ Danger Zone
        </h1>
        <p className="mt-1 text-sm text-[#1B4332]/70">
          Destructive operations. Every action here is permanent and cannot be
          undone.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-wider text-[#1B4332]/55">
          <span className="rounded-full border border-[#1B4332]/15 bg-white px-2.5 py-1">
            {players.length} player{players.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-[#1B4332]/15 bg-white px-2.5 py-1">
            {teams.length} team{teams.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Global status message */}
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
            msg.kind === "ok"
              ? "border-success/30 bg-mint text-success"
              : "border-sold/30 bg-sold/10 text-sold"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ================= DELETE A PLAYER ================= */}
      <section className="rounded-2xl border border-sold/25 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest sm:text-xl">
              Delete a Player
            </h2>
            <p className="mt-0.5 text-xs text-[#1B4332]/60">
              Search and delete an individual player. Sold players refund their
              price to the team; on-block players clear the current block.
            </p>
          </div>
          {playerQuery && (
            <span className="shrink-0 rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
              {filteredPlayers.length} of {players.length}
            </span>
          )}
        </div>

        {players.length > 0 && (
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
                value={playerQuery}
                onChange={(e) => setPlayerQuery(e.target.value)}
                placeholder="Search player by name, category, status, team…"
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] py-2 pl-9 pr-9 text-sm text-forest outline-none transition focus:border-sold/60 focus:ring-2 focus:ring-sold/15"
              />
              {playerQuery && (
                <button
                  type="button"
                  onClick={() => setPlayerQuery("")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#1B4332]/50 transition hover:bg-sold/10 hover:text-sold"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 max-h-[26rem] overflow-y-auto rounded-lg border border-[#1B4332]/12">
          {players.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#1B4332]/55">
              No players in this tournament yet.
            </p>
          ) : filteredPlayers.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#1B4332]/55">
              No players match your search.
            </p>
          ) : (
            <ul className="divide-y divide-[#1B4332]/8">
              {filteredPlayers.map((p) => {
                const team = p.sold_to_team_id
                  ? teams.find((t) => t.id === p.sold_to_team_id)
                  : null;
                const isBusy = deletingPlayerId === p.id;
                const statusColor =
                  p.status === "sold"
                    ? "bg-success/15 text-success"
                    : p.status === "unsold"
                      ? "bg-[#FFA000]/15 text-[#B87333]"
                      : p.status === "on_block"
                        ? "bg-sold/15 text-sold"
                        : "bg-[#1B4332]/10 text-[#1B4332]";
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#FFF9F9]"
                  >
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_url}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-full border border-[#1B4332]/15 object-cover object-top"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-full bg-[#1B4332]/10" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-forest">
                          {p.full_name}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${statusColor}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#1B4332]/55">
                        {[
                          p.category,
                          p.jersey_no != null ? `#${p.jersey_no}` : null,
                          team ? `→ ${team.team_name} (${p.selling_price} pts)` : null,
                          p.current_team,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeletePlayer(p)}
                      disabled={isBusy}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-sold/40 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
                    >
                      {isBusy ? "…" : "Delete"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ================= DELETE A TEAM ================= */}
      <section className="rounded-2xl border border-sold/25 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest sm:text-xl">
              Delete a Team
            </h2>
            <p className="mt-0.5 text-xs text-[#1B4332]/60">
              Search and delete an individual team. All players bought by that
              team will return to Pending status.
            </p>
          </div>
          {teamQuery && (
            <span className="shrink-0 rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
              {filteredTeams.length} of {teams.length}
            </span>
          )}
        </div>

        {teams.length > 0 && (
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
                value={teamQuery}
                onChange={(e) => setTeamQuery(e.target.value)}
                placeholder="Search team by name or captain…"
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] py-2 pl-9 pr-9 text-sm text-forest outline-none transition focus:border-sold/60 focus:ring-2 focus:ring-sold/15"
              />
              {teamQuery && (
                <button
                  type="button"
                  onClick={() => setTeamQuery("")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#1B4332]/50 transition hover:bg-sold/10 hover:text-sold"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 max-h-[22rem] overflow-y-auto rounded-lg border border-[#1B4332]/12">
          {teams.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#1B4332]/55">
              No teams in this tournament yet.
            </p>
          ) : filteredTeams.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#1B4332]/55">
              No teams match your search.
            </p>
          ) : (
            <ul className="divide-y divide-[#1B4332]/8">
              {filteredTeams.map((t) => {
                const bought = players.filter((p) => p.sold_to_team_id === t.id);
                const initial = (t.team_name[0] ?? "?").toUpperCase();
                const isBusy = deletingTeamId === t.id;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#FFF9F9]"
                  >
                    {t.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.photo_url}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-full border border-[#1B4332]/15 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-forest">
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-forest">
                        {t.team_name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#1B4332]/55">
                        {[
                          t.captain_name,
                          `${t.points_remaining} pts left`,
                          bought.length > 0
                            ? `${bought.length} player${bought.length === 1 ? "" : "s"}`
                            : "no players",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTeam(t)}
                      disabled={isBusy}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-sold/40 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
                    >
                      {isBusy ? "…" : "Delete"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ================= CLEAR ALL DATA ================= */}
      <section className="rounded-2xl border border-sold/25 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest sm:text-xl">
              Clear All Data
            </h2>
            <p className="mt-0.5 text-xs text-[#1B4332]/60">
              Removes {players.length} player{players.length === 1 ? "" : "s"} and{" "}
              {teams.length} team{teams.length === 1 ? "" : "s"}, plus groups and
              bid history. The tournament itself is kept.
            </p>
          </div>
        </div>

        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="mt-4 rounded-lg border border-sold/40 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white"
          >
            Clear All Data
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-sold">
              Type <span className="font-mono">CLEAR</span> to confirm
            </label>
            <input
              value={clearText}
              onChange={(e) => setClearText(e.target.value)}
              placeholder="CLEAR"
              className="w-full rounded-lg border border-sold/30 bg-[#FFF7F7] px-3 py-2 font-mono text-sm text-forest outline-none focus:border-sold"
              disabled={clearing}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  setClearText("");
                }}
                disabled={clearing}
                className="flex-1 rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]/70 transition hover:bg-mint"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onClearAll}
                disabled={clearing || clearText !== "CLEAR"}
                className="flex-1 rounded-lg bg-sold px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Confirm Clear"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================= DELETE TOURNAMENT ================= */}
      <section className="rounded-2xl border-2 border-sold/40 bg-[#FFF7F7] p-5 shadow-sm sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-sold sm:text-xl">
          Delete Tournament
        </h2>
        <p className="mt-0.5 text-xs text-[#1B4332]/70">
          Permanently removes the tournament, its players, teams, groups, and
          history.
        </p>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 rounded-lg bg-sold px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
          >
            Delete This Tournament
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-sold">
              Type the tournament name to confirm
            </label>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder={tournamentName}
              className="w-full rounded-lg border border-sold/30 bg-white px-3 py-2 text-sm text-forest outline-none focus:border-sold"
              disabled={deleting}
            />
            <p className="break-all text-[10px] font-mono text-[#1B4332]/50">
              Expected: {tournamentName}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteText("");
                }}
                disabled={deleting}
                className="flex-1 rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]/70 transition hover:bg-mint"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteTournament}
                disabled={deleting || deleteText !== tournamentName}
                className="flex-1 rounded-lg bg-sold px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}