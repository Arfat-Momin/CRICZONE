"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadPlayerPhoto } from "@/lib/storage/upload-photo";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

export type RegisterInput = {
  tournamentId: string;
  values: Record<string, string>;
  photoDataUrl: string | null;
};

export type RegisterOutput =
  | { ok: true; playerId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const STANDARD_IDS = new Set([
  "firstName",
  "surname",
  "mobileNo",
  "jerseyNo",
  "jerseySize",
  "category",
  "currentTeam",
]);

export async function registerPlayerAction(
  input: RegisterInput,
): Promise<RegisterOutput> {
  try {
    const admin = createAdminClient();

    // 1. Load tournament
    const { data: tournament, error: tErr } = await admin
      .from("tournaments")
      .select("id, name, slug, status, registration_enabled, form_config")
      .eq("id", input.tournamentId)
      .maybeSingle();

    if (tErr || !tournament) {
      return { ok: false, error: "Tournament not found." };
    }

    // 2. Status check
    if (tournament.status !== "registration" && tournament.status !== "ready") {
      return { ok: false, error: "Registration is not open for this tournament." };
    }
    if (!tournament.registration_enabled) {
      return { ok: false, error: "Registration is currently closed." };
    }

    // 3. Config check
    const config = normalizeFormConfig(tournament.form_config, tournament.name);
    if (!config.enabled) {
      return { ok: false, error: "Registration is currently closed." };
    }

    // 4. Field validation
    const fieldErrors: Record<string, string> = {};
    const values: Record<string, string> = {};
    let needsPhoto = false;

    for (const field of config.formFields) {
      if (field.type === "photo") {
        needsPhoto = true;
        continue;
      }
      const raw = input.values[field.id];
      const val = typeof raw === "string" ? raw.trim() : "";

      if (field.required && !val) {
        fieldErrors[field.id] = `${field.label} is required.`;
        continue;
      }
      if (val && field.id === "mobileNo" && !/^\d{10}$/.test(val)) {
        fieldErrors[field.id] = "Enter a valid 10-digit mobile number.";
        continue;
      }
      if (val && field.id === "jerseyNo") {
        const n = Number.parseInt(val, 10);
        if (!Number.isFinite(n) || n < 1 || n > 999) {
          fieldErrors[field.id] = "Jersey number must be between 1 and 999.";
          continue;
        }
      }
      values[field.id] = val;
    }

    if (needsPhoto && !input.photoDataUrl) {
      fieldErrors["photo"] = "Player photo is required.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }

    // 5. Mobile uniqueness pre-check
    const mobile = values["mobileNo"] ?? "";
    if (mobile) {
      const { data: existing, error: checkErr } = await admin
        .from("player_contacts")
        .select("player_id")
        .eq("tournament_id", input.tournamentId)
        .eq("mobile_no", mobile)
        .maybeSingle();
      if (checkErr) {
        return { ok: false, error: "Could not verify mobile number. Try again." };
      }
      if (existing) {
        return {
          ok: false,
          error: "This mobile number is already registered.",
          fieldErrors: { mobileNo: "Already registered for this tournament." },
        };
      }
    }

    // 6. Photo upload
    let photoUrl: string | null = null;
    if (input.photoDataUrl) {
      try {
        const up = await uploadPlayerPhoto(input.tournamentId, input.photoDataUrl);
        photoUrl = up.url;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Photo upload failed.";
        return { ok: false, error: msg, fieldErrors: { photo: msg } };
      }
    }

    // 7. Build row
    const firstName = values["firstName"] ?? "";
    const surname = values["surname"] ?? "";
    const fullName =
      `${firstName} ${surname}`.trim() || firstName || surname || "Player";
    const jerseyNoRaw = values["jerseyNo"] ?? "";
    const jerseyNo = jerseyNoRaw ? Number.parseInt(jerseyNoRaw, 10) : null;

    const customFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (!STANDARD_IDS.has(k) && v) customFields[k] = v;
    }

    // 8. Insert player
    const { data: inserted, error: insErr } = await admin
      .from("players")
      .insert({
        tournament_id: input.tournamentId,
        first_name: firstName || null,
        surname: surname || null,
        full_name: fullName,
        jersey_no: jerseyNo,
        jersey_size: values["jerseySize"] || null,
        category: values["category"] || null,
        current_team: values["currentTeam"] || null,
        photo_url: photoUrl,
        base_price: 1,
        status: "pending",
        custom_fields: customFields,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return {
        ok: false,
        error: insErr?.message ?? "Could not save registration.",
      };
    }

    // 9. Contact row
    if (mobile) {
      const { error: cErr } = await admin.from("player_contacts").insert({
        player_id: inserted.id,
        tournament_id: input.tournamentId,
        mobile_no: mobile,
      });
      if (cErr) {
        await admin.from("players").delete().eq("id", inserted.id);
        const duplicate =
          cErr.message?.toLowerCase().includes("duplicate") ||
          cErr.message?.toLowerCase().includes("unique");
        return {
          ok: false,
          error: duplicate
            ? "This mobile number is already registered."
            : "Could not save contact info. Try again.",
          fieldErrors: duplicate ? { mobileNo: "Already registered." } : undefined,
        };
      }
    }

    revalidatePath(`/t/${tournament.slug}`);
    revalidatePath(`/t/${tournament.slug}/register`);

    return { ok: true, playerId: inserted.id };
  } catch (e) {
    console.error("registerPlayerAction failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}