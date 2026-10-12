"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/supabase";
import { browserUpdateStarConfig } from "@/lib/hooks/useAuctionActions";

type Props = {
  tournamentId: string;
  state: Tables<"auction_state"> | null;
  onClose: () => void;
  onMessage: (kind: "ok" | "err", text: string) => void;
};

export function StarModeConfigModal({
  tournamentId,
  state,
  onClose,
  onMessage,
}: Props) {
  const router = useRouter();
  const [basePrice, setBasePrice] = useState(
    String(state?.star_base_price ?? 1000),
  );
  const [increment, setIncrement] = useState(
    String(state?.star_increment ?? 1000),
  );
  const [doubleEnabled, setDoubleEnabled] = useState(
    state?.star_double_enabled ?? false,
  );
  const [threshold, setThreshold] = useState(
    String(state?.star_double_after_bids ?? 10),
  );
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSave() {
    setLocalError(null);
    const bp = Number.parseFloat(basePrice);
    const inc = Number.parseFloat(increment);
    const th = Number.parseInt(threshold, 10);

    if (!Number.isFinite(bp) || bp <= 0) {
      setLocalError("Base price must be greater than 0.");
      return;
    }
    if (!Number.isFinite(inc) || inc <= 0) {
      setLocalError("Increment must be greater than 0.");
      return;
    }
    if (doubleEnabled && (!Number.isFinite(th) || th < 1 || th > 999)) {
      setLocalError("Threshold must be between 1 and 999.");
      return;
    }

    setBusy(true);
    const r = await browserUpdateStarConfig(tournamentId, {
      basePrice: bp,
      increment: inc,
      doubleEnabled,
      doubleAfterBids: doubleEnabled ? th : 10,
    });
    setBusy(false);

    if (!r.ok) {
      onMessage("err", r.error);
      setLocalError(r.error);
      return;
    }
    onMessage("ok", "Star mode settings saved.");
    router.refresh();
    onClose();
  }

  const incrementPreview = doubleEnabled
    ? `${increment || "0"} → ${(Number.parseFloat(increment) || 0) * 2} after ${threshold || "?"} bids`
    : `${increment || "0"} per bid`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-lg rounded-2xl border border-[#7B1FA2]/30 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-bold text-forest">
              ★ Star Mode Settings
            </h2>
            <p className="mt-1 text-xs text-[#1B4332]/60">
              Configure the base bid and how much each subsequent bid adds.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
                Base Price (first bid)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2.5 text-sm text-forest outline-none focus:border-[#7B1FA2] focus:ring-2 focus:ring-[#7B1FA2]/20"
              />
              <p className="mt-1 text-[10px] text-[#1B4332]/50">
                This is the first bid when a player is put on block.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
                Increment (per bid)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2.5 text-sm text-forest outline-none focus:border-[#7B1FA2] focus:ring-2 focus:ring-[#7B1FA2]/20"
              />
              <p className="mt-1 text-[10px] text-[#1B4332]/50">
                Amount each new bid adds to the current total.
              </p>
            </div>
          </div>

          {/* Doubling toggle */}
          <div className="rounded-xl border border-[#7B1FA2]/25 bg-[#FAF5FF] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={doubleEnabled}
                onChange={(e) => setDoubleEnabled(e.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 accent-[#7B1FA2]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-forest">
                  Double the increment after a threshold
                </p>
                <p className="mt-0.5 text-[11px] text-[#1B4332]/55">
                  When enabled, the increment doubles once the number of bids
                  on the current player reaches the threshold.
                </p>
              </div>
            </label>

            {doubleEnabled && (
              <div className="mt-3">
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
                  Threshold (number of bids)
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  step="1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-sm text-forest outline-none focus:border-[#7B1FA2]"
                />
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-[#1B4332]/12 bg-[#FAFDF9] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
              Preview
            </p>
            <div className="mt-2 space-y-1 text-xs text-forest">
              <p>
                First bid:{" "}
                <span className="font-[family-name:var(--font-numeric)] font-bold text-[#7B1FA2]">
                  {basePrice || "—"}
                </span>
              </p>
              <p>
                Each next bid adds:{" "}
                <span className="font-[family-name:var(--font-numeric)] font-bold text-[#7B1FA2]">
                  {incrementPreview}
                </span>
              </p>
            </div>
          </div>

          {localError && (
            <p className="rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
              {localError}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-[#1B4332]/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1B4332]/70 transition hover:bg-mint"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="flex-1 rounded-lg bg-[#7B1FA2] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}