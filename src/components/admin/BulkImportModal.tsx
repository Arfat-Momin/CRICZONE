"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminBulkImportPlayersAction } from "@/lib/actions/bulk-import";

export function BulkImportModal({
  tournamentId,
  onClose,
}: {
  tournamentId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onFile(file: File) {
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setResult(null);
    setError(null);
  }

  async function onSubmit() {
    if (!csvText.trim()) {
      setError("Please select a CSV file or paste its contents.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await adminBulkImportPlayersAction(tournamentId, csvText);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult(r.data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#0F231A]/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Bulk Import Players (CSV)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-[#1B4332]/10 bg-[#FAFDF9] p-3 text-xs text-[#1B4332]/70">
          <p className="font-bold uppercase tracking-wider text-[#1B4332]/60">
            CSV Format
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px]">
            name,mobile,jersey_no,jersey_size,category,current_team,photo_url
          </pre>
          <p className="mt-2">
            Only <strong>name</strong> is required. Mobile must be unique per tournament. Photo
            URL can be a Google Drive share link or a direct image URL.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-lg bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-60"
          >
            Choose CSV File
          </button>
          {fileName && (
            <span className="self-center text-xs font-semibold text-[#1B4332]/70">
              {fileName}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Or paste CSV text
          </label>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setFileName(null);
            }}
            rows={6}
            className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 font-mono text-xs text-forest outline-none transition focus:border-[#2D6A4F]"
            placeholder="name,mobile,jersey_no,jersey_size,category,current_team,photo_url"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-3 rounded-lg border border-success/30 bg-mint px-3 py-3 text-xs">
            <p className="font-bold text-success">
              Imported {result.imported} · Skipped {result.skipped}
              {result.errors.length > 0 && ` · Errors ${result.errors.length}`}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-[11px] text-sold">
                {result.errors.slice(0, 8).map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
                {result.errors.length > 8 && (
                  <li className="italic">
                    …and {result.errors.length - 8} more.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-[#1B4332]/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1B4332]/70 transition hover:bg-mint"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !csvText.trim()}
            className="flex-1 rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-60"
          >
            {busy ? "Importing…" : "Import Players"}
          </button>
        </div>
      </div>
    </div>
  );
}