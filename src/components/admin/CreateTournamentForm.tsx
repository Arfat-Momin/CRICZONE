"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTournamentAction } from "@/lib/actions/tournament";

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [start, setStart] = useState("");
  const [openReg, setOpenReg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const isoStart = start ? new Date(start).toISOString() : null;
      const result = await createTournamentAction({
        name,
        venue: venue || null,
        auctionStartAt: isoStart,
        openForRegistration: openReg,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setVenue("");
      setStart("");
      router.push(`/admin/${result.data.id}`);
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
      className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm"
    >
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
        Create a Tournament
      </h2>
      <p className="mt-1 text-xs text-[#1B4332]/60">
        A public URL will be generated automatically from the name.
      </p>

      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Tournament Name <span className="text-sold">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Season 7 Premier League"
            className={inputCls}
            disabled={busy}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Venue
          </label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g., SS Turf, Main Road"
            className={inputCls}
            disabled={busy}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Auction Start Time
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputCls}
            disabled={busy}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#1B4332]/15 bg-[#FAFDF9] px-3 py-2.5">
          <input
            type="checkbox"
            checked={openReg}
            onChange={(e) => setOpenReg(e.target.checked)}
            className="h-4 w-4 accent-[#1B4332]"
            disabled={busy}
          />
          <span className="text-sm font-semibold text-forest">
            Open for registration immediately
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || name.trim().length < 2}
          className="w-full rounded-lg bg-forest px-4 py-3 text-sm font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Tournament"}
        </button>
      </div>
    </form>
  );
}