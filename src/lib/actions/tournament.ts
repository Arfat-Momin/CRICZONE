"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { slugify } from "@/lib/utils/slug";
import { DEFAULT_FORM_FIELDS } from "@/lib/tournament/form-config";
import type { Tables, TablesInsert } from "@/types/supabase";

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

export async function createTournamentAction(
  input: CreateTournamentInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const name = input.name.trim();
    if (name.length < 2) {
      return { ok: false, error: "Name must be at least 2 characters." };
    }

    const baseSlug = slugify(name);
    if (!baseSlug) {
      return { ok: false, error: "Name must contain letters or numbers." };
    }

    let slug = baseSlug;
    let suffix = 2;
    for (let i = 0; i < 50; i++) {
      const { data } = await supabase
        .from("tournaments")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${suffix++}`;
    }

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