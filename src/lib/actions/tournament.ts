"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { generateShortCode } from "@/lib/utils/slug";
import { DEFAULT_FORM_FIELDS } from "@/lib/tournament/form-config";
import type { Tables, TablesInsert } from "@/types/supabase";
import type { Json } from "@/types/database.types";
import type { FormConfig } from "@/lib/tournament/form-config";

type TournamentStatus = Tables<"tournaments">["status"];

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type CreateTournamentInput = {
  name: string;
  venue: string | null;
  auctionStartAt: string | null;
  openForRegistration: boolean;
};

/**
 * Generates a slug that is guaranteed unique across the tournaments table.
 * Retries up to 10 times if a collision occurs (vanishingly unlikely).
 */
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateShortCode();
    const { data } = await supabase
      .from("tournaments")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("Could not generate a unique slug — please try again.");
}

export async function createTournamentAction(
  input: CreateTournamentInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const name = input.name.trim();
    if (name.length < 2) {
      return { ok: false, error: "Name must be at least 2 characters." };
    }

    const slug = await generateUniqueSlug(supabase);

    const formConfig = {
      enabled: true,
      title: `${name} Player Registration`,
      description: "Fill in your details to enter the auction roster.",
      formFields: DEFAULT_FORM_FIELDS,
    };

    const insert: TablesInsert<"tournaments"> = {
      name,
      slug,
      venue: input.venue?.trim() || null,
      auction_start_at: input.auctionStartAt || null,
      status: input.openForRegistration ? "registration" : "draft",
      registration_enabled: true,
      grouping_enabled: false,
      form_config: formConfig,
    };

    const { data, error } = await supabase
      .from("tournaments")
      .insert(insert)
      .select("id, slug")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Could not create tournament." };
    }

    revalidatePath("/admin/dashboard");
    return { ok: true, data: { id: data.id, slug: data.slug } };
  } catch (e) {
    console.error("createTournamentAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function updateTournamentStatusAction(
  tournamentId: string,
  status: TournamentStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("tournaments")
      .update({ status })
      .eq("id", tournamentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/${tournamentId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function toggleRegistrationAction(
  tournamentId: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("tournaments")
      .update({ registration_enabled: enabled })
      .eq("id", tournamentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/${tournamentId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function deleteTournamentAction(
  tournamentId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/dashboard");
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}
export async function setGroupingModeAction(
  tournamentId: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("tournaments")
      .update({ grouping_enabled: enabled })
      .eq("id", tournamentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/admin/${tournamentId}/live`);
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}
export async function updateFormConfigAction(
  tournamentId: string,
  formConfig: FormConfig,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const title = formConfig.title?.trim() || "Player Registration";
    const description =
      formConfig.description?.trim() ||
      "Fill in your details to enter the auction roster.";
    const fields = Array.isArray(formConfig.formFields) ? formConfig.formFields : [];
    const cardFields = Array.isArray(formConfig.cardDisplayFields)
      ? formConfig.cardDisplayFields
      : [];

    if (fields.length === 0) {
      return { ok: false, error: "Form must have at least one field." };
    }

    const payload = {
      enabled: formConfig.enabled !== false,
      title,
      description,
      formFields: fields,
      cardDisplayFields: cardFields,
    } as unknown as Json;

    const { data: updated, error } = await supabase
      .from("tournaments")
      .update({
        form_config: payload,
        registration_enabled: formConfig.enabled !== false,
      })
      .eq("id", tournamentId)
      .select("slug")
      .single();

    if (error || !updated) {
      return { ok: false, error: error?.message ?? "Could not save form settings." };
    }

    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/t/${updated.slug}`, "page");
    revalidatePath(`/t/${updated.slug}/register`, "page");

    return { ok: true, data: { slug: updated.slug } };
  } catch (e) {
    console.error("updateFormConfigAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}