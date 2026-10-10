"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionResult } from "./tournament";

export type SiteState = "online" | "maintenance";

export async function setSiteStateAction(
  state: SiteState,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("global_settings")
      .update({ site_state: state })
      .eq("id", "site");
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/how-it-works");
    revalidatePath("/admin/dashboard");
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}