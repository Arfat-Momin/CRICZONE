"use client";

import { useRef, useState } from "react";
import { fileToWebpDataUrl } from "@/lib/utils/image-client";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string | null;
  /** Longest-edge cap before WebP export. Default 800 (player photo). Posters: 1600. */
  maxDim?: number;
  /** Aspect class for the preview frame. Default "rounded-full". Posters: "rounded-lg". */
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
  const [dragover, setDragover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLocalError(null);
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose a valid image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError("Image must be under 8 MB.");
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

  const previewClass =
    previewShape === "round"
      ? "h-20 w-20 rounded-full border-2 border-[#2D6A4F] object-cover"
      : "h-20 w-32 rounded-lg border-2 border-[#2D6A4F] object-cover";

  return (
    <div>
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
            ? "border-[#1B4332] bg-mint/50"
            : "border-[#2D6A4F]/35 bg-[#FAFDF9] hover:bg-mint/20"
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

        {value ? (
          <div className="flex items-center gap-4 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className={previewClass} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-forest">Ready</p>
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
            <p className="mt-2 text-sm font-bold text-forest">
              {busy ? "Processing…" : "Drag & drop image here"}
            </p>
            <p className="mt-0.5 text-xs text-[#1B4332]/60">
              or{" "}
              <span className="font-semibold text-[#2D6A4F] underline">
                browse device
              </span>
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-[#1B4332]/40">
              {hint ?? "Auto-converted to WebP · max 8 MB"}
            </p>
          </div>
        )}
      </div>

      {(localError || error) && (
        <p className="mt-2 text-xs font-semibold text-sold">{localError ?? error}</p>
      )}
    </div>
  );
}