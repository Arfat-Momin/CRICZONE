"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFormConfigAction } from "@/lib/actions/tournament";
import type { FormConfig } from "@/lib/tournament/form-config";

type Props = {
  tournamentId: string;
  initialConfig: FormConfig;
  onClose: () => void;
};

export function BlockDisplayFieldsModal({
  tournamentId,
  initialConfig,
  onClose,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(
    initialConfig.auctionBlockDisplayFields,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build displayable field list from form fields
  const displayable: { id: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const f of initialConfig.formFields) {
    if (f.id === "photo" || f.id === "firstName" || f.id === "surname") continue;
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    displayable.push({ id: f.id, label: f.label });
  }
  if (!seen.has("basePrice")) {
    displayable.push({ id: "basePrice", label: "Base Price" });
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) =>
      on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id),
    );
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const nextConfig: FormConfig = {
        ...initialConfig,
        auctionBlockDisplayFields: selected,
      };
      const r = await updateFormConfigAction(tournamentId, nextConfig);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-md rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
              ⚡ Auction Block Display
            </h2>
            <p className="mt-1 text-xs text-[#1B4332]/60">
              Choose which fields appear on the big on-the-block card during live bidding.
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

        <div className="mt-5 space-y-2">
          {displayable.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#1B4332]/15 bg-[#FAFDF9] p-4 text-center text-xs text-[#1B4332]/55">
              No optional fields. Configure them in the Registration page first.
            </p>
          ) : (
            displayable.map((f) => {
              const checked = selected.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    checked
                      ? "border-success bg-mint"
                      : "border-[#1B4332]/10 bg-white hover:border-[#2D6A4F]/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(f.id, e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 accent-[#2D6A4F]"
                  />
                  <span className="font-semibold text-forest">{f.label}</span>
                  {f.id === "basePrice" && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#1B4332]/45">
                      Optional
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <p className="mt-3 text-[11px] text-[#1B4332]/55">
          Photo and player name are always shown. Only these extra fields are toggleable.
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
            {error}
          </p>
        )}

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
            className="flex-1 rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Fields"}
          </button>
        </div>
      </div>
    </div>
  );
}