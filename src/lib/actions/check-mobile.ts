"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type MobileCheckResult =
  | { ok: true; available: boolean }
  | { ok: false; error: string };

/**
 * Public endpoint — called live from the registration form while the
 * user types their mobile number. Returns whether that number is still
 * available for this tournament.
 *
 * Guardrails:
 *   - Only allowed while the tournament's registration is open
 *     (status in {registration, ready} AND registration_enabled = true)
 *   - Never reveals WHY a number is taken (just available or not)
 *   - Never reveals the player who registered it
 */
export async function checkMobileAvailableAction(
  tournamentId: string,
  mobile: string,
): Promise<MobileCheckResult> {
  try {
    const digits = mobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(digits)) {
      // Treat invalid as "not available" so the UI blocks submit
      return { ok: true, available: false };
    }

    const admin = createAdminClient();

    // ---- Gate: only allow live checks while registration is open ----
    const { data: tournament } = await admin
      .from("tournaments")
      .select("status, registration_enabled")
      .eq("id", tournamentId)
      .maybeSingle();

    if (!tournament) {
      return { ok: false, error: "Tournament not found." };
    }
    const open =
      tournament.registration_enabled === true &&
      (tournament.status === "registration" || tournament.status === "ready");
    if (!open) {
      return { ok: false, error: "Registration is not open." };
    }

    // ---- The actual uniqueness check ----
    const { data, error } = await admin
      .from("player_contacts")
      .select("player_id")
      .eq("tournament_id", tournamentId)
      .eq("mobile_no", digits)
      .maybeSingle();

    if (error) {
      console.error("checkMobileAvailableAction query failed:", error.message);
      return { ok: false, error: "Could not verify mobile number." };
    }

    return { ok: true, available: !data };
  } catch (e) {
    console.error("checkMobileAvailableAction failed:", e);
    return { ok: false, error: "Could not verify mobile number." };
  }
}