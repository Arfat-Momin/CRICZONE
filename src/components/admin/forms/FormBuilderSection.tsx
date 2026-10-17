"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateFormConfigAction, toggleRegistrationAction } from "@/lib/actions/tournament";
import { FormPreviewModal } from "./FormPreviewModal";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";
import {
  DEFAULT_FORM_FIELDS,
  DEFAULT_CARD_DISPLAY_FIELDS,
  DEFAULT_AUCTION_BLOCK_DISPLAY_FIELDS,
  LOCKED_FIELD_IDS,
  type FormConfig,
  type FormFieldDef,
  type FormFieldType,
} from "@/lib/tournament/form-config";

type Props = {
  tournamentId: string;
  tournamentName: string;
  initialConfig: FormConfig;
};

const CUSTOM_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text Input" },
  { value: "number", label: "Number Input" },
  { value: "tel", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple Choice" },
  { value: "textarea", label: "Long Text" },
];

function newCustomId(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  const rand = Math.random().toString(36).slice(2, 8);
  return `custom_${slug || "field"}_${rand}`;
}

export function FormBuilderSection({
  tournamentId,
  tournamentName,
  initialConfig,
}: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FormFieldType>("text");
  const dialogs = useAppDialogs();

  const displayableFields = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const f of config.formFields) {
      if (f.id === "photo" || f.id === "firstName" || f.id === "surname") continue;
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      items.push({ id: f.id, label: f.label });
    }
    if (!seen.has("basePrice")) {
      items.push({ id: "basePrice", label: "Base Price" });
    }
    return items;
  }, [config.formFields]);

  function setField(index: number, patch: Partial<FormFieldDef>) {
    setConfig((c) => {
      const next = c.formFields.slice();
      const current = next[index];
      if (!current) return c;
      next[index] = { ...current, ...patch };
      return { ...c, formFields: next };
    });
  }

  function moveField(index: number, dir: -1 | 1) {
    setConfig((c) => {
      const target = index + dir;
      if (target < 0 || target >= c.formFields.length) return c;
      const next = c.formFields.slice();
      const a = next[index];
      const b = next[target];
      if (!a || !b) return c;
      next[index] = b;
      next[target] = a;
      return { ...c, formFields: next };
    });
  }

  function deleteField(index: number) {
    setConfig((c) => {
      const f = c.formFields[index];
      if (!f || LOCKED_FIELD_IDS.has(f.id)) return c;
      const next = c.formFields.filter((_, i) => i !== index);
      const card = c.cardDisplayFields.filter((id) => id !== f.id);
      const block = c.auctionBlockDisplayFields.filter((id) => id !== f.id);
      return {
        ...c,
        formFields: next,
        cardDisplayFields: card,
        auctionBlockDisplayFields: block,
      };
    });
  }

  function addField() {
    const label = newLabel.trim();
    if (!label) return;
    const id = newCustomId(label);
    const needsOptions = newType === "select" || newType === "radio";
    const field: FormFieldDef = {
      id,
      label,
      type: newType,
      required: false,
      ...(needsOptions ? { options: ["Option A", "Option B"] } : {}),
    };
    setConfig((c) => ({ ...c, formFields: [...c.formFields, field] }));
    setNewLabel("");
    setNewType("text");
  }

  function toggleCardField(id: string, on: boolean) {
    setConfig((c) => {
      const set = new Set(c.cardDisplayFields);
      if (on) set.add(id);
      else set.delete(id);
      return { ...c, cardDisplayFields: Array.from(set) };
    });
  }

  function toggleBlockField(id: string, on: boolean) {
    setConfig((c) => {
      const set = new Set(c.auctionBlockDisplayFields);
      if (on) set.add(id);
      else set.delete(id);
      return { ...c, auctionBlockDisplayFields: Array.from(set) };
    });
  }

  async function resetToDefaults() {
    const ok = await dialogs.confirm({
      title: "Reset form to defaults?",
      description:
        "Custom fields will be removed and the default CRICZONE fields will be restored.",
      confirmLabel: "Reset Form",
      tone: "warning",
    });
    if (!ok) return;
    setConfig((c) => ({
      ...c,
      formFields: DEFAULT_FORM_FIELDS,
      cardDisplayFields: DEFAULT_CARD_DISPLAY_FIELDS,
      auctionBlockDisplayFields: DEFAULT_AUCTION_BLOCK_DISPLAY_FIELDS,
    }));
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await updateFormConfigAction(tournamentId, config);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess("Form settings saved.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
            Registration Form
          </h2>
          <p className="mt-1 text-sm text-[#1B4332]/60">
            Configure which fields players fill in, and which show up on their cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#1B4332]/10 bg-white px-3 py-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
              Registration
            </span>
            <button
              type="button"
              onClick={async () => {
                const next = !config.enabled;
                setConfig((c) => ({ ...c, enabled: next }));
                await toggleRegistrationAction(tournamentId, next);
                router.refresh();
              }}
              className={`relative h-5 w-10 shrink-0 rounded-full transition ${
                config.enabled ? "bg-success" : "bg-[#1B4332]/20"
              }`}
              aria-label="Toggle registration"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  config.enabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                config.enabled ? "text-success" : "text-sold"
              }`}
            >
              {config.enabled ? "Open" : "Closed"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
          >
            Preview
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — builder */}
        <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Form Title
              </label>
              <input
                value={config.title}
                onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none focus:border-[#2D6A4F]"
                disabled={busy}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none focus:border-[#2D6A4F]"
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1B4332]/60">
              Fields ({config.formFields.length})
            </h3>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={busy}
              className="text-[11px] font-bold text-[#1B4332]/60 hover:underline disabled:opacity-50"
            >
              Reset to defaults
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {config.formFields.map((f, i) => {
              const locked = LOCKED_FIELD_IDS.has(f.id);
              const needsOptions = f.type === "select" || f.type === "radio";
              return (
                <li
                  key={f.id}
                  className={`rounded-xl border p-3 ${
                    locked
                      ? "border-[#1B4332]/10 bg-[#F3F6FF]"
                      : "border-[#1B4332]/10 bg-[#FDF6FF]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveField(i, -1)}
                        disabled={busy || i === 0}
                        className="rounded border border-[#1B4332]/15 bg-white px-1.5 text-[10px] leading-none text-[#1B4332]/70 hover:bg-mint disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(i, 1)}
                        disabled={busy || i === config.formFields.length - 1}
                        className="rounded border border-[#1B4332]/15 bg-white px-1.5 text-[10px] leading-none text-[#1B4332]/70 hover:bg-mint disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={f.label}
                          onChange={(e) => setField(i, { label: e.target.value })}
                          disabled={busy}
                          className="min-w-[120px] flex-1 rounded-md border border-[#1B4332]/20 bg-white px-2 py-1 text-sm font-semibold text-forest outline-none focus:border-[#2D6A4F]"
                        />
                        {locked ? (
                          <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[10px] font-bold text-[#1565C0]">
                            Core
                          </span>
                        ) : (
                          <>
                            <select
                              value={f.type}
                              onChange={(e) =>
                                setField(i, { type: e.target.value as FormFieldType })
                              }
                              disabled={busy}
                              className="rounded-md border border-[#1B4332]/20 bg-white px-2 py-1 text-xs text-forest outline-none"
                            >
                              {CUSTOM_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <span className="rounded-full bg-[#F3E5F5] px-2 py-0.5 text-[10px] font-bold text-[#7B1FA2]">
                              Custom
                            </span>
                          </>
                        )}
                        <label className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#1B4332]/70">
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={(e) => setField(i, { required: e.target.checked })}
                            disabled={busy}
                            className="h-3.5 w-3.5 accent-[#1B4332]"
                          />
                          Required
                        </label>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => deleteField(i)}
                            disabled={busy}
                            className="rounded-md border border-sold/40 bg-sold/10 px-2 py-0.5 text-[10px] font-bold text-sold hover:bg-sold/20 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {needsOptions && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#1B4332]/60">
                            Options (comma-separated)
                          </label>
                          <input
                            value={(f.options ?? []).join(", ")}
                            onChange={(e) =>
                              setField(i, {
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter((s) => s.length > 0),
                              })
                            }
                            disabled={busy}
                            className="w-full rounded-md border border-[#1B4332]/20 bg-white px-2 py-1 text-xs text-forest outline-none focus:border-[#2D6A4F]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-xl border border-dashed border-[#9c27b0]/40 bg-[#FDF6FF]/40 p-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#7B1FA2]">
              Add Custom Field
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Field label, e.g. Age, City…"
                className="min-w-[160px] flex-1 rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-sm text-forest outline-none focus:border-[#2D6A4F]"
                disabled={busy}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as FormFieldType)}
                disabled={busy}
                className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-sm text-forest outline-none"
              >
                {CUSTOM_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addField}
                disabled={busy || !newLabel.trim()}
                className="rounded-lg bg-[#7B1FA2] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — display configurations + save */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          {/* Roster card display */}
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
              🃏 Roster Card Display
            </h3>
            <p className="mt-1 text-xs text-[#1B4332]/60">
              Fields shown on the small player card in the roster list.
            </p>

            <div className="mt-4 space-y-1.5">
              {displayableFields.map((f) => {
                const checked = config.cardDisplayFields.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                      checked
                        ? "border-[#1565C0] bg-[#E3F2FD]"
                        : "border-[#1B4332]/10 bg-white hover:border-[#2D6A4F]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleCardField(f.id, e.target.checked)}
                      disabled={busy}
                      className="h-3.5 w-3.5 accent-[#1565C0]"
                    />
                    <span className="font-semibold text-forest">{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Auction block display */}
          <div className="rounded-2xl border border-mint/30 bg-[#F0FBF4] p-5 shadow-sm">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
              ⚡ Auction Block Display
            </h3>
            <p className="mt-1 text-xs text-[#1B4332]/60">
              Fields shown on the big on-the-block player card during live auction.
            </p>

            <div className="mt-4 space-y-1.5">
              {displayableFields.map((f) => {
                const checked = config.auctionBlockDisplayFields.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                      checked
                        ? "border-success bg-mint"
                        : "border-[#1B4332]/10 bg-white hover:border-[#2D6A4F]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleBlockField(f.id, e.target.checked)}
                      disabled={busy}
                      className="h-3.5 w-3.5 accent-[#2D6A4F]"
                    />
                    <span className="font-semibold text-forest">{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
            {error && (
              <p className="mb-3 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
                {error}
              </p>
            )}
            {success && (
              <p className="mb-3 rounded-lg border border-success/30 bg-mint px-3 py-2 text-xs font-semibold text-success">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="w-full rounded-lg bg-forest px-4 py-3 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Form Settings"}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <FormPreviewModal
          config={config}
          tournamentName={tournamentName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </section>
  );
}