"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearTournamentDataAction,
  deleteTournamentAction,
} from "@/lib/actions/tournament";

type Props = {
  tournamentId: string;
  tournamentName: string;
  playerCount: number;
  teamCount: number;
};

export function DangerZone({
  tournamentId,
  tournamentName,
  playerCount,
  teamCount,
}: Props) {
  const router = useRouter();

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearText, setClearText] = useState("");
  const [clearing, setClearing] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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

  return (
    <section className="mt-12 rounded-2xl border-2 border-sold/30 bg-[#FFF7F7] p-6 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-sold">
        Danger Zone
      </h2>
      <p className="mt-1 text-sm text-[#1B4332]/70">
        These actions are permanent and cannot be undone. Take a CSV export first.
      </p>

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

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Clear all data */}
        <div className="rounded-xl border border-sold/30 bg-white p-5">
          <h3 className="text-base font-bold text-forest">Clear all tournament data</h3>
          <p className="mt-1 text-xs text-[#1B4332]/60">
            Removes {playerCount} player{playerCount === 1 ? "" : "s"} and{" "}
            {teamCount} team{teamCount === 1 ? "" : "s"}, plus groups and bid history.
            The tournament itself is kept.
          </p>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="mt-4 rounded-lg border border-sold/40 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white"
            >
              Clear Data
            </button>
          ) : (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-sold">
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
        </div>

        {/* Delete tournament */}
        <div className="rounded-xl border border-sold/30 bg-white p-5">
          <h3 className="text-base font-bold text-forest">Delete this tournament</h3>
          <p className="mt-1 text-xs text-[#1B4332]/60">
            Permanently removes the tournament, its players, teams, groups, and
            history.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 rounded-lg bg-sold px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
            >
              Delete Tournament
            </button>
          ) : (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-sold">
                Type the tournament name to confirm
              </label>
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder={tournamentName}
                className="w-full rounded-lg border border-sold/30 bg-[#FFF7F7] px-3 py-2 text-sm text-forest outline-none focus:border-sold"
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
        </div>
      </div>
    </section>
  );
}