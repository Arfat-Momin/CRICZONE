"use client";

const DEFAULT_MAX_DIM = 800;
const QUALITY = 0.85;

/**
 * Reads a File, resizes so the longest edge is <= maxDim, and returns
 * a WebP data URL. Throws if the browser can't produce WebP.
 *
 * Player photos: 800px (default). Posters / banners: pass 1600.
 */
export async function fileToWebpDataUrl(
  file: File,
  maxDim: number = DEFAULT_MAX_DIM,
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

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > h && w > maxDim) {
    h = Math.round((h * maxDim) / w);
    w = maxDim;
  } else if (h > maxDim) {
    w = Math.round((w * maxDim) / h);
    h = maxDim;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/webp", QUALITY);
  if (!out.startsWith("data:image/webp")) {
    throw new Error("This browser does not support WebP export.");
  }
  return out;
}