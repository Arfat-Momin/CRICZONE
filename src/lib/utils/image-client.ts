"use client";

const MAX_DIM = 800;
const QUALITY = 0.85;

/**
 * Reads a File, resizes to <=800px on the long edge, and returns a WebP data URL.
 * Throws a clear error if the browser can't produce WebP.
 */
export async function fileToWebpDataUrl(file: File): Promise<string> {
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
  if (w > h && w > MAX_DIM) {
    h = Math.round((h * MAX_DIM) / w);
    w = MAX_DIM;
  } else if (h > MAX_DIM) {
    w = Math.round((w * MAX_DIM) / h);
    h = MAX_DIM;
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