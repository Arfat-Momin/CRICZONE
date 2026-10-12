"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ComboboxOption = {
  id: string;
  label: string;
  /** Small grey text shown below the label (e.g. status, points). */
  meta?: string;
};

type Props = {
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Show an × to clear the current selection. */
  clearable?: boolean;
  className?: string;
};

export function SearchCombobox({
  options,
  value,
  onChange,
  placeholder = "— Select —",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  disabled = false,
  clearable = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Autofocus search when opened
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
    setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.meta ?? "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const selected = options.find((o) => o.id === value) ?? null;

  function toggle() {
    if (disabled) return;
    setOpen((v) => !v);
  }

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-[#FDFCF0] px-3 py-2.5 text-left text-sm transition ${
          disabled
            ? "cursor-not-allowed border-[#1B4332]/10 opacity-55"
            : open
              ? "border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20"
              : "border-[#1B4332]/20 hover:border-[#2D6A4F]/50"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="font-semibold text-forest">{selected.label}</span>
          ) : (
            <span className="text-[#1B4332]/45">{placeholder}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clear}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#1B4332]/50 transition hover:bg-sold/10 hover:text-sold"
              title="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className={`h-4 w-4 text-[#1B4332]/50 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#1B4332]/15 bg-white shadow-xl">
          <div className="border-b border-[#1B4332]/8 p-2">
            <div className="relative">
              <span
                aria-hidden
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1B4332]/40"
              >
                🔍
              </span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-[#1B4332]/15 bg-[#FDFCF0] py-1.5 pl-8 pr-2 text-sm text-forest outline-none focus:border-[#2D6A4F]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-[#1B4332]/50">
                {emptyMessage}
              </p>
            ) : (
              <ul className="py-1">
                {filtered.map((o) => {
                  const isActive = o.id === value;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => pick(o.id)}
                        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-mint text-forest"
                            : "text-forest hover:bg-[#FAFDF9]"
                        }`}
                      >
                        <span className="min-w-0 max-w-full truncate font-semibold">
                          {o.label}
                        </span>
                        {o.meta && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]/45">
                            {o.meta}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[#1B4332]/8 bg-[#FAFDF9] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#1B4332]/45">
            {filtered.length} of {options.length}
          </div>
        </div>
      )}
    </div>
  );
}