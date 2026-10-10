import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "player-photos";
const PLAYER_MAX_BYTES = 4 * 1024 * 1024;
const POSTER_MAX_BYTES = 8 * 1024 * 1024;

export type UploadResult = { url: string; path: string };

function parseDataUrl(dataUrl: string): {
  subtype: string;
  base64: string;
  sizeBytes: number;
} {
  const match = dataUrl.match(
    /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid image format. Expected WebP, JPEG, or PNG.");
  }
  const subtype = match[1];
  const base64 = match[2];
  const sizeBytes = Math.round((base64.length * 3) / 4);
  return { subtype, base64, sizeBytes };
}

function extFor(subtype: string): { ext: string; contentType: string } {
  if (subtype === "webp") return { ext: "webp", contentType: "image/webp" };
  if (subtype === "png") return { ext: "png", contentType: "image/png" };
  return { ext: "jpg", contentType: "image/jpeg" };
}

export async function uploadPlayerPhoto(
  tournamentId: string,
  dataUrl: string,
): Promise<UploadResult> {
  const { subtype, base64, sizeBytes } = parseDataUrl(dataUrl);
  if (sizeBytes > PLAYER_MAX_BYTES) {
    throw new Error(
      `Image is ${Math.round(sizeBytes / 1024)} KB. Max is ${PLAYER_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const buffer = Buffer.from(base64, "base64");
  const { ext, contentType } = extFor(subtype);
  const key = `${tournamentId}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(key, buffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(key);
  return { url: data.publicUrl, path: key };
}

export async function uploadTournamentPoster(
  tournamentId: string,
  dataUrl: string,
): Promise<UploadResult> {
  const { subtype, base64, sizeBytes } = parseDataUrl(dataUrl);
  if (sizeBytes > POSTER_MAX_BYTES) {
    throw new Error(
      `Poster is ${Math.round(sizeBytes / 1024)} KB. Max is ${POSTER_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const buffer = Buffer.from(base64, "base64");
  const { ext, contentType } = extFor(subtype);
  const key = `posters/${tournamentId}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(key, buffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Poster upload failed: ${error.message}`);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(key);
  return { url: data.publicUrl, path: key };
}

/**
 * Flexible image input resolver used by admin actions.
 *
 * Accepts:
 *   - null / ""       → returns { url: null, path: null }
 *   - data:image/...  → uploads to Supabase Storage, returns public URL
 *   - http(s)://...   → stores the URL directly (no re-upload)
 *
 * Kind controls size limits + storage path prefix.
 */
export async function resolveImageInput(
  tournamentId: string,
  input: string | null | undefined,
  kind: "player" | "poster",
): Promise<{ url: string | null; path: string | null }> {
  if (!input) return { url: null, path: null };
  const trimmed = input.trim();
  if (!trimmed) return { url: null, path: null };

  if (trimmed.startsWith("data:")) {
    const up =
      kind === "poster"
        ? await uploadTournamentPoster(tournamentId, trimmed)
        : await uploadPlayerPhoto(tournamentId, trimmed);
    return { url: up.url, path: up.path };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    // Basic length guard so we don't store pathological inputs
    if (trimmed.length > 2000) {
      throw new Error("URL is too long (max 2000 characters).");
    }
    return { url: trimmed, path: null };
  }

  throw new Error("Unsupported image input (must be a data URL or http(s) URL).");
}