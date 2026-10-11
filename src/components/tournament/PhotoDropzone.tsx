"use client";

import { useRef, useState } from "react";
import { fileToWebpDataUrl } from "@/lib/utils/image-client";

type Mode = "upload" | "url";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string | null;
  maxDim?: number;
  previewShape?: "round" | "rect";
  hint?: string;
};

export function PhotoDropzone({
  value,
  onChange,
  error,
  maxDim,
  previewShape = "round",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const [dragover, setDragover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  async function handleFile(file: File) {
    setLocalError(null);
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose a valid image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setLocalError("Image must be under 12 MB.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToWebpDataUrl(file, maxDim);
      onChange(dataUrl);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not process image.");
    } finally {
      setBusy(false);
    }
  }

  function applyUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setLocalError("URL must start with http:// or https://");
      return;
    }
    setLocalError(null);
    setUrlPreviewError(false);
    onChange(trimmed);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setLocalError(null);
    setUrlPreviewError(false);
    if (next === "url") {
      if (value && value.startsWith("data:")) {
        onChange(null);
        setUrlDraft("");
      } else if (value) {
        setUrlDraft(value);
      }
    } else {
      if (value && /^https?:\/\//i.test(value)) {
        onChange(null);
      }
    }
  }

  const previewClass =
    previewShape === "round"
      ? "h-20 w-20 rounded-full border-2 border-mint/50 object-cover"
      : "h-20 w-32 rounded-lg border-2 border-mint/50 object-cover";

  return (
    <div>
      {/* Mode toggle */}
      <div className="mb-2 inline-flex rounded-lg border border-mint/15 bg-[#0A1410] p-0.5">
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
            mode === "upload"
              ? "bg-mint text-forest"
              : "text-cream/55 hover:text-mint"
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
            mode === "url"
              ? "bg-mint text-forest"
              : "text-cream/55 hover:text-mint"
          }`}
        >
          Use URL
        </button>
      </div>

      {mode === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragover(true);
          }}
          onDragLeave={() => setDragover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragover(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
            dragover
              ? "border-mint bg-mint/10"
              : "border-mint/30 bg-[#0A1410] hover:bg-mint/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />

          {value && value.startsWith("data:") ? (
            <div className="flex items-center gap-4 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" className={previewClass} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-cream">Ready</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null);
                  }}
                  className="mt-1 text-xs font-semibold text-sold hover:underline"
                >
                  Change / remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-2xl" aria-hidden>
                📷
              </p>
              <p className="mt-2 text-sm font-bold text-cream">
                {busy ? "Processing…" : "Drag & drop image here"}
              </p>
              <p className="mt-0.5 text-xs text-cream/55">
                or{" "}
                <span className="font-semibold text-mint underline">
                  browse device
                </span>
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cream/35">
                {hint ?? "Auto-converted to WebP · max 12 MB"}
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "url" && (
        <div className="rounded-xl border border-mint/15 bg-[#0A1410] p-4">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-cream/55">
            Paste image URL
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlPreviewError(false);
              }}
              placeholder="https://example.com/photo.jpg"
              className="min-w-0 flex-1 rounded-lg border border-mint/15 bg-[#050A08] px-3 py-2 text-sm text-cream outline-none focus:border-mint/50"
            />
            <button
              type="button"
              onClick={applyUrl}
              disabled={!urlDraft.trim()}
              className="rounded-lg bg-mint px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-cream disabled:opacity-50"
            >
              Set
            </button>
          </div>

          {value && /^https?:\/\//i.test(value) && (
            <div className="mt-3 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="URL preview"
                className={previewClass}
                onError={() => setUrlPreviewError(true)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-cream/65">{value}</p>
                {urlPreviewError ? (
                  <p className="mt-1 text-xs font-semibold text-sold">
                    ⚠ Image failed to load — check the URL
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-semibold text-mint">✓ URL set</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setUrlDraft("");
                    setUrlPreviewError(false);
                  }}
                  className="mt-1 text-xs font-semibold text-sold hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cream/35">
            Direct link ends in .jpg/.png/.webp · Google Drive share links work
          </p>
        </div>
      )}

      {(localError || error) && (
        <p className="mt-2 text-xs font-semibold text-sold">{localError ?? error}</p>
      )}
    </div>
  );
}