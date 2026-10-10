"use client";

/** Default longest-edge cap for player photos (covers 800 CSS px @ 2x DPR). */
const DEFAULT_MAX_DIM = 1600;
/** Near-lossless WebP — preserves detail at reasonable file sizes. */
const DEFAULT_QUALITY = 0.92;

/**
 * Reads a File, downscales progressively for sharpness, and returns
 * a WebP data URL.
 *
 * Player photos: maxDim 1600, quality 0.92 (default)
 * Posters:       maxDim 2400, quality 0.92
 *
 * Throws if the browser cannot produce WebP.
 */
export async function fileToWebpDataUrl(
  file: File,
  maxDim: number = DEFAULT_MAX_DIM,
  quality: number = DEFAULT_QUALITY,
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Failed to load image"));
    i.src = rawDataUrl;
  });

  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const longest = Math.max(naturalW, naturalH);

  // ---- Compute final target size ----
  let targetW = naturalW;
  let targetH = naturalH;
  if (longest > maxDim) {
    const scale = maxDim / longest;
    targetW = Math.max(1, Math.round(naturalW * scale));
    targetH = Math.max(1, Math.round(naturalH * scale));
  }

  // ---- Multi-step downscale for sharpness on large ratios ----
  // Browser bilinear downscaling gets soft on big ratios (>2x). Pre-halving
  // preserves detail. We only do this when the ratio is significant.
  let source: HTMLImageElement | HTMLCanvasElement = img;
  let srcW = naturalW;
  let srcH = naturalH;

  while (srcW > targetW * 2 && srcH > targetH * 2) {
    const halfW = Math.max(1, Math.floor(srcW / 2));
    const halfH = Math.max(1, Math.floor(srcH / 2));
    const half = document.createElement("canvas");
    half.width = halfW;
    half.height = halfH;
    const hctx = half.getContext("2d");
    if (!hctx) break;
    hctx.imageSmoothingEnabled = true;
    hctx.imageSmoothingQuality = "high";
    hctx.drawImage(source, 0, 0, halfW, halfH);
    source = half;
    srcW = halfW;
    srcH = halfH;
  }

  // ---- Final draw at exact target size ----
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetW, targetH);

  const out = canvas.toDataURL("image/webp", quality);
  if (!out.startsWith("data:image/webp")) {
    throw new Error("This browser does not support WebP export.");
  }
  return out;
}