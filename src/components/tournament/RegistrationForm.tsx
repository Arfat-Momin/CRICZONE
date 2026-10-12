"use client";

import { useEffect, useRef, useState } from "react";
import { registerPlayerAction } from "@/lib/actions/register";
import { checkMobileAvailableAction } from "@/lib/actions/check-mobile";
import { PhotoDropzone } from "./PhotoDropzone";
import type { FormConfig, FormFieldDef } from "@/lib/tournament/form-config";

type Props = {
  tournamentId: string;
  tournamentName: string;
  config: FormConfig;
};

type MobileStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken" }
  | { kind: "error"; message: string };

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
  const [values, setValues] = useState<Record<string, string>>(() =>
    blankValues(config),
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<MobileStatus>({
    kind: "idle",
  });

  const mobileCheckTimer = useRef<number | null>(null);
  const mobileCheckSeq = useRef(0);

  // Detect whether the form even has a mobile field
  const mobileField = config.formFields.find((f) => f.id === "mobileNo");
  const mobileValue = values["mobileNo"] ?? "";

  // ---- Live mobile uniqueness check (debounced) ----
  useEffect(() => {
    if (!mobileField) return;

    // Clear any in-flight timer
    if (mobileCheckTimer.current !== null) {
      window.clearTimeout(mobileCheckTimer.current);
      mobileCheckTimer.current = null;
    }

    const digits = mobileValue.replace(/\D/g, "");

    if (!digits) {
      setMobileStatus({ kind: "idle" });
      return;
    }
    if (digits.length < 10) {
      setMobileStatus({ kind: "idle" });
      return;
    }

    // Kick off a debounced check
    setMobileStatus({ kind: "checking" });
    const seq = ++mobileCheckSeq.current;

    mobileCheckTimer.current = window.setTimeout(async () => {
      try {
        const r = await checkMobileAvailableAction(tournamentId, digits);
        // Ignore stale responses (user typed again while we were checking)
        if (seq !== mobileCheckSeq.current) return;

        if (!r.ok) {
          setMobileStatus({ kind: "error", message: r.error });
          return;
        }
        setMobileStatus(
          r.available ? { kind: "available" } : { kind: "taken" },
        );
      } catch (e) {
        if (seq !== mobileCheckSeq.current) return;
        setMobileStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Check failed.",
        });
      }
    }, 400);

    return () => {
      if (mobileCheckTimer.current !== null) {
        window.clearTimeout(mobileCheckTimer.current);
        mobileCheckTimer.current = null;
      }
    };
  }, [mobileValue, mobileField, tournamentId]);

  function setValue(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  // Mobile blocker: submit disabled while checking / taken / error / invalid
  const mobileBlocksSubmit =
    !!mobileField &&
    mobileField.required &&
    mobileStatus.kind !== "available";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(null);

    // Hard stop if the mobile is not confirmed available
    if (mobileBlocksSubmit) {
      if (mobileStatus.kind === "checking") {
        setGlobalError("Please wait — still checking your mobile number…");
      } else if (mobileStatus.kind === "taken") {
        setGlobalError(
          "This mobile number is already registered for this tournament.",
        );
      } else if (mobileStatus.kind === "error") {
        setGlobalError(mobileStatus.message);
      } else {
        setGlobalError("Please enter a valid 10-digit mobile number.");
      }
      return;
    }

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
      <div className="rounded-2xl border border-mint/30 bg-[#0A1410] p-8 text-center shadow-[0_0_60px_-20px_rgba(216,243,220,0.35)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-3xl text-white">
          ✓
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-cream">
          You&apos;re in!
        </h3>
        <p className="mt-2 text-sm text-cream/70">
          Your registration for <strong className="text-mint">{tournamentName}</strong>{" "}
          has been recorded. You&apos;ll appear in the roster below.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setValues(blankValues(config));
            setPhoto(null);
            setFieldErrors({});
            setGlobalError(null);
            setMobileStatus({ kind: "idle" });
            mobileCheckSeq.current++;
          }}
          className="mt-5 rounded-lg border border-mint/25 bg-mint/5 px-4 py-2 text-sm font-semibold text-mint transition hover:bg-mint/15"
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
          mobileStatus={field.id === "mobileNo" ? mobileStatus : undefined}
        />
      ))}

      {photoField && (
        <div className="rounded-2xl border border-mint/12 bg-[#0A1410] p-5">
          <label className="mb-2 block text-sm font-bold text-cream">
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
          className="rounded-lg border border-sold/40 bg-sold/10 px-4 py-3 text-sm font-semibold text-sold"
        >
          {globalError}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || mobileBlocksSubmit}
        className="w-full rounded-xl bg-mint px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_14px_50px_-12px_rgba(216,243,220,0.75)] transition hover:-translate-y-0.5 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy
          ? "Submitting…"
          : mobileStatus.kind === "checking"
            ? "Checking mobile…"
            : mobileBlocksSubmit && mobileStatus.kind === "taken"
              ? "Mobile already registered"
              : "Submit Registration"}
      </button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  mobileStatus,
}: {
  field: FormFieldDef;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  mobileStatus?: MobileStatus;
}) {
  const inputId = `field-${field.id}`;
  const base =
    "w-full rounded-lg border border-mint/15 bg-[#050A08] px-4 py-2.5 text-cream placeholder:text-cream/30 outline-none transition focus:border-mint/50 focus:ring-2 focus:ring-mint/15";

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
          <option key={o} value={o} className="bg-[#0A1410] text-cream">
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
                ? "border-mint/60 bg-mint/10 text-mint"
                : "border-mint/15 bg-[#0A1410] text-cream/70 hover:border-mint/35"
            }`}
          >
            <input
              type="radio"
              name={field.id}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="accent-mint"
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
    <div className="rounded-2xl border border-mint/12 bg-[#0A1410] p-5">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-cream">
        {field.label}
        {field.required && <span className="ml-1 text-sold">*</span>}
      </label>
      {inputEl}

      {/* Live mobile feedback */}
      {mobileStatus && mobileStatus.kind !== "idle" && (
        <p
          className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold ${
            mobileStatus.kind === "available"
              ? "text-success"
              : mobileStatus.kind === "checking"
                ? "text-mint/70"
                : "text-sold"
          }`}
        >
          {mobileStatus.kind === "checking" && (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-mint/25 border-t-mint" />
              Checking availability…
            </>
          )}
          {mobileStatus.kind === "available" && (
            <>
              <span aria-hidden>✓</span> Mobile available
            </>
          )}
          {mobileStatus.kind === "taken" && (
            <>
              <span aria-hidden>✗</span> This mobile number is already registered for this tournament.
            </>
          )}
          {mobileStatus.kind === "error" && (
            <>
              <span aria-hidden>⚠</span> {mobileStatus.message}
            </>
          )}
        </p>
      )}

      {error && <p className="mt-1.5 text-xs font-semibold text-sold">{error}</p>}
    </div>
  );
}