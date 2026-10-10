"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionResult } from "./tournament";

type CreateTeamInput = {
  tournamentId: string;
  teamName: string;
  captainName: string | null;
  photoUrl: string | null;
  pointsRemaining: number;
  maxPlayers: number | null;
};

export async function createTeamAction(
  input: CreateTeamInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const teamName = input.teamName.trim();
    if (teamName.length < 2) {
      return { ok: false, error: "Team name must be at least 2 characters." };
    }
    if (input.pointsRemaining < 0) {
      return { ok: false, error: "Starting points must be >= 0." };
    }
    if (input.maxPlayers !== null && input.maxPlayers < 1) {
      return { ok: false, error: "Max players must be >= 1." };
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        tournament_id: input.tournamentId,
        team_name: teamName,
        captain_name: input.captainName?.trim() || null,
        photo_url: input.photoUrl?.trim() || null,
        points_remaining: input.pointsRemaining,
        max_players: input.maxPlayers,
      })
      .select("id")
      .single();

    if (error || !data) {
      const dup = error?.message?.toLowerCase().includes("unique");
      return {
        ok: false,
        error: dup
          ? "A team with this name already exists in this tournament."
          : error?.message ?? "Could not create team.",
      };
    }

    revalidatePath(`/admin/${input.tournamentId}`);
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function deleteTeamAction(
  teamId: string,
  tournamentId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
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

export async function updateTeamAction(
  teamId: string,
  tournamentId: string,
  patch: {
    teamName?: string;
    captainName?: string | null;
    photoUrl?: string | null;
    pointsRemaining?: number;
    maxPlayers?: number | null;
  },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("teams")
      .update({
        team_name: patch.teamName?.trim() || undefined,
        captain_name: patch.captainName === undefined ? undefined : patch.captainName,
        photo_url: patch.photoUrl === undefined ? undefined : patch.photoUrl,
        points_remaining: patch.pointsRemaining,
        max_players: patch.maxPlayers,
      })
      .eq("id", teamId);

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