"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionResult } from "./tournament";

type CreateGroupInput = {
  tournamentId: string;
  name: string;
  playerIds: string[];
};

export async function createGroupAction(
  input: CreateGroupInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const name = input.name.trim();
    if (name.length < 1 || name.length > 60) {
      return { ok: false, error: "Group name must be 1–60 characters." };
    }
    const uniqueIds = Array.from(new Set(input.playerIds));
    if (uniqueIds.length === 0) {
      return { ok: false, error: "Select at least one player." };
    }

    // 1. Validate all players belong to this tournament
    const { data: validPlayers, error: pErr } = await supabase
      .from("players")
      .select("id")
      .eq("tournament_id", input.tournamentId)
      .in("id", uniqueIds);

    if (pErr) return { ok: false, error: pErr.message };
    const validIds = new Set((validPlayers ?? []).map((p) => p.id));
    const missing = uniqueIds.filter((id) => !validIds.has(id));
    if (missing.length > 0) {
      return { ok: false, error: "Some players do not belong to this tournament." };
    }

    // 2. Validate none are already in a group (defense-in-depth; DB enforces too)
    const { data: existingMembership } = await supabase
      .from("player_group_members")
      .select("player_id")
      .eq("tournament_id", input.tournamentId)
      .in("player_id", uniqueIds);

    if (existingMembership && existingMembership.length > 0) {
      return {
        ok: false,
        error: "One or more selected players are already in a group.",
      };
    }

    // 3. Next sort_order
    const { data: maxRow } = await supabase
      .from("player_groups")
      .select("sort_order")
      .eq("tournament_id", input.tournamentId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.sort_order ?? -1) + 1;

    // 4. Insert group
    const { data: group, error: gErr } = await supabase
      .from("player_groups")
      .insert({
        tournament_id: input.tournamentId,
        name,
        sort_order: nextOrder,
      })
      .select("id")
      .single();

    if (gErr || !group) {
      const dup =
        gErr?.message?.toLowerCase().includes("duplicate") ||
        gErr?.message?.toLowerCase().includes("unique");
      return {
        ok: false,
        error: dup
          ? `A group named "${name}" already exists.`
          : gErr?.message ?? "Could not create group.",
      };
    }

    // 5. Insert memberships
    const rows = uniqueIds.map((pid) => ({
      tournament_id: input.tournamentId,
      group_id: group.id,
      player_id: pid,
    }));
    const { error: mErr } = await supabase.from("player_group_members").insert(rows);
    if (mErr) {
      // Roll back the group
      await supabase.from("player_groups").delete().eq("id", group.id);
      return { ok: false, error: mErr.message };
    }

    revalidatePath(`/admin/${input.tournamentId}`);
    revalidatePath(`/admin/${input.tournamentId}/live`);
    return { ok: true, data: { id: group.id } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function deleteGroupAction(
  groupId: string,
  tournamentId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("player_groups").delete().eq("id", groupId);
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