"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadPlayerPhoto } from "@/lib/storage/upload-photo";

type BulkResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

/**
 * CSV columns (header required, order-independent):
 * name, mobile, jersey_no, jersey_size, category, current_team, photo_url
 *
 * Only "name" is required. Rows with duplicate mobile numbers within the
 * tournament are skipped (not counted as errors — reported in skipped).
 */
export async function adminBulkImportPlayersAction(
  tournamentId: string,
  csvText: string,
): Promise<{ ok: true; data: BulkResult } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const lines = csvText.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { ok: false, error: "CSV must have a header row and at least one data row." };
    }

    const header = parseCsvLine(lines[0] ?? "").map((h) => h.trim().toLowerCase());
    const idx = {
      name: header.indexOf("name"),
      mobile: header.indexOf("mobile"),
      jerseyNo: header.indexOf("jersey_no"),
      jerseySize: header.indexOf("jersey_size"),
      category: header.indexOf("category"),
      currentTeam: header.indexOf("current_team"),
      photoUrl: header.indexOf("photo_url"),
    };

    if (idx.name === -1) {
      return {
        ok: false,
        error: "CSV missing required column: name. Required headers: name, mobile, jersey_no, jersey_size, category, current_team, photo_url",
      };
    }

    // Preload existing mobile numbers for uniqueness
    const { data: existingContacts } = await admin
      .from("player_contacts")
      .select("mobile_no")
      .eq("tournament_id", tournamentId);
    const existingMobiles = new Set(
      (existingContacts ?? []).map((c) => c.mobile_no),
    );

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Sequential to keep error reporting clean; volume is small.
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      try {
        const cols = parseCsvLine(lines[i] ?? "");
        const pick = (n: number): string =>
          n >= 0 && n < cols.length ? (cols[n] ?? "").trim() : "";

        const fullName = pick(idx.name);
        if (!fullName) {
          skipped++;
          continue;
        }

        const [firstName, ...rest] = fullName.split(/\s+/);
        const surname = rest.join(" ");
        const mobileDigits = pick(idx.mobile).replace(/\D/g, "");
        const hasMobile = /^\d{10}$/.test(mobileDigits);

        if (hasMobile && existingMobiles.has(mobileDigits)) {
          skipped++;
          continue;
        }

        const jerseyNoStr = pick(idx.jerseyNo);
        const jerseyNo = jerseyNoStr ? Number.parseInt(jerseyNoStr, 10) : null;
        const jerseySize = pick(idx.jerseySize) || null;
        const category = pick(idx.category) || null;
        const currentTeam = pick(idx.currentTeam) || null;
        const externalPhoto = pick(idx.photoUrl);

        // If photo_url is a Google Drive share URL, convert to thumbnail URL
        let photoUrl: string | null = null;
        if (externalPhoto) {
          const driveId = extractDriveId(externalPhoto);
          photoUrl = driveId
            ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w400-h400`
            : externalPhoto;
        }

        // Skip data-URL photo uploads from CSV (not supported for security + size reasons)
        if (photoUrl && photoUrl.startsWith("data:")) photoUrl = null;

        const { data: inserted, error: insErr } = await admin
          .from("players")
          .insert({
            tournament_id: tournamentId,
            first_name: firstName ?? null,
            surname: surname || null,
            full_name: fullName,
            jersey_no: Number.isFinite(jerseyNo) ? jerseyNo : null,
            jersey_size: jerseySize,
            category,
            current_team: currentTeam,
            photo_url: photoUrl,
            base_price: 1,
            status: "pending",
          })
          .select("id")
          .single();

        if (insErr || !inserted) {
          errors.push(`Row ${rowNumber}: ${insErr?.message ?? "insert failed"}`);
          continue;
        }

        if (hasMobile) {
          const { error: cErr } = await admin.from("player_contacts").insert({
            player_id: inserted.id,
            tournament_id: tournamentId,
            mobile_no: mobileDigits,
          });
          if (cErr) {
            await admin.from("players").delete().eq("id", inserted.id);
            if (
              cErr.message.toLowerCase().includes("duplicate") ||
              cErr.message.toLowerCase().includes("unique")
            ) {
              skipped++;
            } else {
              errors.push(`Row ${rowNumber}: ${cErr.message}`);
            }
            continue;
          }
          existingMobiles.add(mobileDigits);
        }

        imported++;
      } catch (rowErr) {
        errors.push(
          `Row ${rowNumber}: ${rowErr instanceof Error ? rowErr.message : "unknown error"}`,
        );
      }
    }

    revalidatePath(`/admin/${tournamentId}`);
    return { ok: true, data: { imported, skipped, errors } };
  } catch (e) {
    console.error("adminBulkImportPlayersAction failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

// ---------- helpers ----------

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function extractDriveId(url: string): string | null {
  try {
    if (url.includes("/d/")) {
      const parts = url.split("/d/");
      const after = parts[1];
      if (after) return after.split("/")[0] ?? null;
    }
    if (url.includes("id=")) {
      const q = url.split("?")[1];
      if (q) {
        const params = new URLSearchParams(q);
        return params.get("id");
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Kept for future file-upload bulk import (not used yet)
export async function _uploadDataUrlHelper(
  tournamentId: string,
  dataUrl: string,
): Promise<string | null> {
  try {
    const up = await uploadPlayerPhoto(tournamentId, dataUrl);
    return up.url;
  } catch {
    return null;
  }
}