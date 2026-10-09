"use client";

import { useState } from "react";
import { registerPlayerAction } from "@/lib/actions/register";
import { PhotoDropzone } from "./PhotoDropzone";
import type { FormConfig, FormFieldDef } from "@/lib/tournament/form-config";

type Props = {
  tournamentId: string;
  tournamentName: string;
  config: FormConfig;
};

function blankValues(config: FormConfig): Record<string, string> {
  const v: Record<string, string> = {};
  for (const f of config.formFields) {
    if ((f.type === "radio" || f.type === "select") && f.options?.[0]) {
      v[f.id] = f.options[0];
    } else {
      v[f.id] = "";
    }
  }
  return v;
}

export function RegistrationForm({ tournamentId, tournamentName, config }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => blankValues(config));
  const [photo, setPhoto] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function setValue(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(null);
    setBusy(true);
    try {
      const result = await registerPlayerAction({
        tournamentId,
        values,
        photoDataUrl: photo,
      });
      if (result.ok) {
        setSuccess(true);
        return;
      }
      setGlobalError(result.error);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-[#2D6A4F]/30 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-3xl text-white">
          ✓
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          You&apos;re in!
        </h3>
        <p className="mt-2 text-sm text-[#1B4332]/70">
          Your registration for <strong>{tournamentName}</strong> has been recorded.
          You&apos;ll appear in the roster below.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setValues(blankValues(config));
            setPhoto(null);
            setFieldErrors({});
            setGlobalError(null);
          }}
          className="mt-5 rounded-lg border border-[#1B4332]/20 px-4 py-2 text-sm font-semibold text-forest transition hover:bg-mint"
        >
          Register another player
        </button>
      </div>
    );
  }

  const nonPhotoFields = config.formFields.filter((f) => f.type !== "photo");
  const photoField = config.formFields.find((f) => f.type === "photo");

  return (
    <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
      {nonPhotoFields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={values[field.id] ?? ""}
          onChange={(v) => setValue(field.id, v)}
          error={fieldErrors[field.id]}
        />
      ))}

      {photoField && (
        <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-bold text-forest">
            {photoField.label}
            {photoField.required && <span className="ml-1 text-sold">*</span>}
          </label>
          <PhotoDropzone
            value={photo}
            onChange={setPhoto}
            error={fieldErrors["photo"]}
          />
        </div>
      )}

      {globalError && (
        <div
          role="alert"
          className="rounded-lg border border-sold/30 bg-sold/10 px-4 py-3 text-sm font-semibold text-sold"
        >
          {globalError}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-forest px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-cream shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? "Submitting…" : "Submit Registration"}
      </button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormFieldDef;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputId = `field-${field.id}`;
  const base =
    "w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-4 py-2.5 text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20";

  let inputEl: React.ReactNode = null;

  if (field.type === "textarea") {
    inputEl = (
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={base}
      />
    );
  } else if (field.type === "select" && field.options) {
    inputEl = (
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "radio" && field.options) {
    inputEl = (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {field.options.map((o) => (
          <label
            key={o}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              value === o
                ? "border-[#2D6A4F] bg-mint text-forest"
                : "border-[#1B4332]/15 bg-white text-[#1B4332]/80 hover:border-[#2D6A4F]/40"
            }`}
          >
            <input
              type="radio"
              name={field.id}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="accent-[#1B4332]"
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  } else {
    const inputType =
      field.type === "number"
        ? "number"
        : field.type === "email"
          ? "email"
          : field.type === "tel"
            ? "tel"
            : "text";
    inputEl = (
      <input
        id={inputId}
        type={inputType}
        value={value}
        onChange={(e) => {
          let v = e.target.value;
          if (field.id === "mobileNo") v = v.replace(/\D/g, "").slice(0, 10);
          onChange(v);
        }}
        inputMode={field.id === "mobileNo" ? "numeric" : undefined}
        maxLength={field.id === "mobileNo" ? 10 : undefined}
        min={field.id === "jerseyNo" ? 1 : undefined}
        max={field.id === "jerseyNo" ? 999 : undefined}
        className={base}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-forest">
        {field.label}
        {field.required && <span className="ml-1 text-sold">*</span>}
      </label>
      {inputEl}
      {error && <p className="mt-1.5 text-xs font-semibold text-sold">{error}</p>}
    </div>
  );
}