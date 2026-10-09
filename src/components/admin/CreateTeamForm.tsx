"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamAction } from "@/lib/actions/team";

export function CreateTeamForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [points, setPoints] = useState("100");
  const [maxPlayers, setMaxPlayers] = useState("6");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const pointsNum = Number.parseInt(points, 10) || 100;
      const maxNum = maxPlayers.trim() === "" ? null : Number.parseInt(maxPlayers, 10);
      const result = await createTeamAction({
        tournamentId,
        teamName,
        captainName: captainName || null,
        pointsRemaining: pointsNum,
        maxPlayers: maxNum,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Added "${teamName}"`);
      setTeamName("");
      setCaptainName("");
      setPoints("100");
      setMaxPlayers("6");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm"
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
        Add a Team
      </h3>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Team Name <span className="text-sold">*</span>
          </label>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., Team Titans"
            className={inputCls}
            disabled={busy}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Captain Name
          </label>
          <input
            value={captainName}
            onChange={(e) => setCaptainName(e.target.value)}
            placeholder="e.g., Rohan Sharma"
            className={inputCls}
            disabled={busy}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
              Points
            </label>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={inputCls}
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
              Max Players
            </label>
            <input
              type="number"
              min={1}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              placeholder="Leave empty for no limit"
              className={inputCls}
              disabled={busy}
            />
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
          type="submit"
          disabled={busy || teamName.trim().length < 2}
          className="w-full rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add Team"}
        </button>
      </div>
    </form>
  );
}