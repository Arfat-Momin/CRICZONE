"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { generateShortCode } from "@/lib/utils/slug";
import { DEFAULT_FORM_FIELDS } from "@/lib/tournament/form-config";
import { resolveImageInput } from "@/lib/storage/upload-photo";
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
  posterInput?: string | null;
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

    // Optional poster — resolved after insert (needs tournament id in path for uploads)
    if (input.posterInput) {
      try {
        const resolved = await resolveImageInput(data.id, input.posterInput, "poster");
        if (resolved.url) {
          await supabase
            .from("tournaments")
            .update({ poster_url: resolved.url })
            .eq("id", data.id);
        }
      } catch (posterErr) {
        // Non-fatal: tournament created, admin can upload later from Overview
        console.warn("Poster upload failed during creation:", posterErr);
      }
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

    // Fetch current config to update the nested `enabled` flag safely
    const { data: t } = await supabase
      .from("tournaments")
      .select("form_config")
      .eq("id", tournamentId)
      .single();

    const currentConfig = (t?.form_config as any) || {};

    const { error } = await supabase
      .from("tournaments")
      .update({
        registration_enabled: enabled,
        form_config: { ...currentConfig, enabled },
      })
      .eq("id", tournamentId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/t/[slug]`, "page");
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
    const blockFields = Array.isArray(formConfig.auctionBlockDisplayFields)
      ? formConfig.auctionBlockDisplayFields
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
      auctionBlockDisplayFields: blockFields,
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
export async function clearTournamentDataAction(
  tournamentId: string,
): Promise<ActionResult<{ deleted: number }>> {
  try {
    const { supabase } = await requireAdmin();

    // Count players first for the response
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    // Delete in dependency-safe order
    await supabase.from("players").delete().eq("tournament_id", tournamentId);
    await supabase.from("teams").delete().eq("tournament_id", tournamentId);
    await supabase.from("player_groups").delete().eq("tournament_id", tournamentId);
    await supabase.from("bid_events").delete().eq("tournament_id", tournamentId);

    // Reset auction_state
    await supabase
      .from("auction_state")
      .update({
        current_player_id: null,
        current_bid_price: 0,
        current_highest_team_id: null,
        shuffling_name: null,
        bid_mode: "normal",
      })
      .eq("tournament_id", tournamentId);

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/admin/${tournamentId}/live`);

    return { ok: true, data: { deleted: count ?? 0 } };
  } catch (e) {
    console.error("clearTournamentDataAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}
export async function updatePosterAction(
  tournamentId: string,
  posterInput: string | null,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const { data: t } = await supabase
      .from("tournaments")
      .select("slug")
      .eq("id", tournamentId)
      .maybeSingle();
    if (!t) return { ok: false, error: "Tournament not found." };

    // Remove
    if (posterInput === null) {
      const { error } = await supabase
        .from("tournaments")
        .update({ poster_url: null })
        .eq("id", tournamentId);
      if (error) return { ok: false, error: error.message };

      revalidatePath(`/admin/${tournamentId}`);
      revalidatePath(`/t/${t.slug}`, "page");
      return { ok: true, data: { slug: t.slug } };
    }

    // Resolve (data URL -> upload; http URL -> store directly)
    let url: string;
    try {
      const resolved = await resolveImageInput(tournamentId, posterInput, "poster");
      if (!resolved.url) return { ok: false, error: "Poster processing failed." };
      url = resolved.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Poster processing failed.";
      return { ok: false, error: msg };
    }

    const { error } = await supabase
      .from("tournaments")
      .update({ poster_url: url })
      .eq("id", tournamentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/t/${t.slug}`, "page");
    return { ok: true, data: { slug: t.slug } };
  } catch (e) {
    console.error("updatePosterAction failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}