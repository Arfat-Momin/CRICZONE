"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./tournament";

export type SiteState = "online" | "maintenance";

/**
 * Toggles the global site_state.
 *
 * Flow:
 *   1. Verify the caller is a signed-in admin (throws if not)
 *   2. Perform the write via the SERVICE ROLE client — bypasses RLS so
 *      no silent-row-block can swallow the change
 *   3. Use .select().single() to detect that a row was actually updated
 *   4. Revalidate every public page so the change propagates
 */
export async function setSiteStateAction(
  state: SiteState,
): Promise<ActionResult> {
  try {
    // Step 1 — auth check
    const { user } = await requireAdmin();

    // Step 2 — write via service_role
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("global_settings")
      .update({ site_state: state })
      .eq("id", "site")
      .select("id, site_state")
      .single();

    if (error) {
      console.error("setSiteStateAction DB error:", error.message);
      return { ok: false, error: `Database error: ${error.message}` };
    }
    if (!data) {
      return {
        ok: false,
        error:
          "Update returned no rows. Verify that the global_settings table has a row with id = 'site'.",
      };
    }
    if (data.site_state !== state) {
      return {
        ok: false,
        error: `State was not applied (DB returned "${data.site_state}" instead of "${state}").`,
      };
    }

    // Step 4 — propagate
    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/archive/[slug]", "page");
    revalidatePath("/how-it-works");
    revalidatePath("/admin/dashboard");
    revalidatePath("/t/[slug]", "page");

    console.info(
      `setSiteStateAction: ${state} applied by ${user.email} (site_state=${data.site_state})`,
    );

    return { ok: true, data: undefined };
  } catch (e) {
    console.error("setSiteStateAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}