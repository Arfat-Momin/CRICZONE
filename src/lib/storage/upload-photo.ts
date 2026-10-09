import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "player-photos";
const MAX_BYTES = 2 * 1024 * 1024;

export type UploadPhotoResult = { url: string; path: string };

export async function uploadPlayerPhoto(
  tournamentId: string,
  dataUrl: string,
): Promise<UploadPhotoResult> {
  const match = dataUrl.match(
    /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match || !match[2]) {
    throw new Error("Invalid image format. Expected WebP, JPEG, or PNG.");
  }
  const [, subtype, base64] = match;
  const sizeBytes = Math.round((base64.length * 3) / 4);
  if (sizeBytes > MAX_BYTES) {
    throw new Error(
      `Image is ${Math.round(sizeBytes / 1024)} KB. Max is ${MAX_BYTES / 1024 / 1024} MB.`,
    );
  }

  const buffer = Buffer.from(base64, "base64");
  const ext = subtype === "webp" ? "webp" : subtype === "png" ? "png" : "jpg";
  const contentType =
    ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
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