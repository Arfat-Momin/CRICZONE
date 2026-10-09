"use client";

import { useRef } from "react";

type Props = {
  value: string;
  buttonLabel: string;
};

export function ReadOnlyUrlField({ value, buttonLabel }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useStateSafe(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for older browsers
      inputRef.current?.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        // Silently ignore — copy is not critical
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-lg border border-[#1B4332]/15 bg-[#FAFDF9] px-2 py-1.5 text-[11px] font-mono text-[#1B4332]/70 outline-none focus:border-[#2D6A4F]"
      />
      <button
        type="button"
        onClick={onCopy}
        className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-1.5 text-xs font-bold text-forest whitespace-nowrap transition hover:bg-mint"
      >
        {copied ? "Copied!" : buttonLabel}
      </button>
    </div>
  );
}

// Tiny helper to avoid importing useState when not strictly needed at top
import { useState } from "react";
function useStateSafe(initial: boolean) {
  return useState(initial);
}