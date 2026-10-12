"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePosterAction } from "@/lib/actions/tournament";
import { PhotoDropzone } from "@/components/tournament/PhotoDropzone";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

type Props = {
  tournamentId: string;
  currentPosterUrl: string | null;
};

export function TournamentPosterCard({ tournamentId, currentPosterUrl }: Props) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [poster, setPoster] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showCurrent = currentPosterUrl && !poster;

  async function onSave() {
    if (!poster) {
      setError("Choose a poster image first.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await updatePosterAction(tournamentId, poster);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess("Poster saved.");
      setPoster(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 2500);
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    const ok = await dialogs.confirm({
      title: "Remove the tournament poster?",
      description: "You can upload a new one at any time.",
      confirmLabel: "Remove Poster",
      tone: "warning",
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await updatePosterAction(tournamentId, null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess("Poster removed.");
      setPoster(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
            Tournament Poster
          </h2>
          <p className="mt-0.5 text-xs text-[#1B4332]/60">
            Banner shown on the public page and thumbnail in the live auction.
          </p>
        </div>
        {currentPosterUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg border border-sold/40 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sold transition hover:bg-sold hover:text-white disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {showCurrent && (
        <div className="mt-4 overflow-hidden rounded-xl border border-[#1B4332]/10">
          <div className="aspect-[21/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPosterUrl}
              alt="Current poster"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <PhotoDropzone
          value={poster}
          onChange={setPoster}
          maxDim={1600}
          previewShape="rect"
          hint="Landscape recommended · auto-converted to WebP · max 8 MB"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg border border-success/30 bg-mint px-3 py-2 text-xs font-semibold text-success">
          {success}
        </p>
      )}

      {poster && (
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
        >
          {busy ? "Saving…" : currentPosterUrl ? "Replace Poster" : "Upload Poster"}
        </button>
      )}
    </section>
  );
}