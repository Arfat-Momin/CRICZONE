"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type DialogTone = "danger" | "warning" | "primary";

export type ConfirmOptions =
  | string
  | {
      title: string;
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      tone?: DialogTone;
    };

export type PromptOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  input: {
    label: string;
    placeholder?: string;
    expectedValue?: string;
    defaultValue?: string;
  };
};

export type AlertOptions =
  | string
  | {
      title: string;
      description?: string;
      confirmLabel?: string;
      tone?: DialogTone;
    };

export type DialogApi = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  alert: (opts: AlertOptions) => Promise<void>;
};

type PendingKind = "confirm" | "prompt" | "alert";

type Pending = {
  kind: PendingKind;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string | null;
  tone: DialogTone;
  input?: PromptOptions["input"];
  resolve: (value: boolean | string | null) => void;
};

const ConfirmContext = createContext<DialogApi | null>(null);

export function useAppDialogs(): DialogApi {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useAppDialogs must be used within <ConfirmProvider>");
  }
  return ctx;
}

function toneStyles(tone: DialogTone) {
  if (tone === "danger") {
    return {
      badge: "bg-[#C1121F]/10 text-[#C1121F]",
      icon: "⚠",
      confirmBtn: "bg-[#C1121F] text-white hover:brightness-110",
    };
  }
  if (tone === "warning") {
    return {
      badge: "bg-[#FFA000]/15 text-[#B87333]",
      icon: "!",
      confirmBtn: "bg-[#FFA000] text-white hover:brightness-110",
    };
  }
  return {
    badge: "bg-[#1B4332]/10 text-[#1B4332]",
    icon: "?",
    confirmBtn: "bg-[#1B4332] text-[#FDFCF0] hover:bg-[#2D6A4F]",
  };
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    const o = typeof opts === "string" ? { title: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setPending({
        kind: "confirm",
        title: o.title,
        description: o.description,
        confirmLabel: o.confirmLabel ?? "Confirm",
        cancelLabel: o.cancelLabel ?? "Cancel",
        tone: o.tone ?? "primary",
        resolve: (v) => resolve(v === true),
      });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setInputValue(opts.input.defaultValue ?? "");
      setPending({
        kind: "prompt",
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Confirm",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        tone: opts.tone ?? "primary",
        input: opts.input,
        resolve: (v) => resolve(typeof v === "string" ? v : null),
      });
    });
  }, []);

  const alertFn = useCallback((opts: AlertOptions): Promise<void> => {
    const o = typeof opts === "string" ? { title: opts } : opts;
    return new Promise<void>((resolve) => {
      setPending({
        kind: "alert",
        title: o.title,
        description: o.description,
        confirmLabel: o.confirmLabel ?? "OK",
        cancelLabel: null,
        tone: o.tone ?? "primary",
        resolve: () => resolve(),
      });
    });
  }, []);

  const api: DialogApi = { confirm, prompt, alert: alertFn };

  const handleConfirm = () => {
    if (!pending) return;
    if (pending.kind === "prompt") pending.resolve(inputValue);
    else pending.resolve(true);
    setPending(null);
  };

  const handleCancel = () => {
    if (!pending) return;
    if (pending.kind === "prompt") pending.resolve(null);
    else pending.resolve(false);
    setPending(null);
  };

  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
      else if (e.key === "Enter" && pending && pending.kind !== "prompt") {
        handleConfirm();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const requireMatch = pending?.input?.expectedValue;
  const confirmDisabled = !!(
    pending?.kind === "prompt" &&
    requireMatch &&
    inputValue.trim() !== requireMatch
  );

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {pending && (
              <motion.div
                key="confirm-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={handleCancel}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F231A]/60 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label={pending.title}
              >
                <motion.div
                  key="confirm-panel"
                  initial={{ scale: 0.95, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1B4332]/15 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 border-b border-[#1B4332]/8 px-5 py-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${toneStyles(pending.tone).badge}`}
                      aria-hidden
                    >
                      {toneStyles(pending.tone).icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-[#1B4332]">
                        {pending.title}
                      </h2>
                      {pending.description && (
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#1B4332]/70">
                          {pending.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prompt input */}
                  {pending.kind === "prompt" && pending.input && (
                    <div className="border-b border-[#1B4332]/8 px-5 py-4">
                      <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#1B4332]/60">
                        {pending.input.label}
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={pending.input.placeholder}
                        className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-[#1B4332] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                      />
                      {requireMatch && (
                        <p className="mt-2 text-[11px] font-semibold text-[#1B4332]/55">
                          Expected:{" "}
                          <span className="font-mono font-bold text-[#C1121F]">
                            {requireMatch}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 bg-[#FAFDF9] px-5 py-3">
                    {pending.cancelLabel && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]/70 transition hover:bg-[#E8F3EC]"
                      >
                        {pending.cancelLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={confirmDisabled}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${toneStyles(pending.tone).confirmBtn}`}
                    >
                      {pending.confirmLabel}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}