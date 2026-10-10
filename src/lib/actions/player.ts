"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadPlayerPhoto } from "@/lib/storage/upload-photo";
import type { ActionResult } from "./tournament";
import type { TablesUpdate } from "@/types/supabase";

type CreatePlayerInput = {
  tournamentId: string;
  firstName: string;
  surname: string;
  mobileNo: string;
  jerseyNo: number | null;
  jerseySize: string | null;
  category: string | null;
  currentTeam: string | null;
  basePrice: number;
  photoDataUrl: string | null;
};

type UpdatePlayerInput = {
  playerId: string;
  tournamentId: string;
  firstName: string;
  surname: string;
  mobileNo: string;
  jerseyNo: number | null;
  jerseySize: string | null;
  category: string | null;
  currentTeam: string | null;
  basePrice: number;
  /** If provided (data URL), replaces the existing photo. */
  photoDataUrl: string | null;
  /** If true, removes the existing photo (photoDataUrl ignored). */
  clearPhoto: boolean;
};

function buildFullName(first: string, last: string): string {
  const full = `${first} ${last}`.trim();
  return full || first || last || "Player";
}

function validateMobile(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 0) return null; // optional in admin flow
  if (!/^\d{10}$/.test(digits)) return "Mobile must be exactly 10 digits.";
  return null;
}

export async function adminCreatePlayerAction(
  input: CreatePlayerInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const first = input.firstName.trim();
    const last = input.surname.trim();
    if (!first && !last) {
      return { ok: false, error: "Provide at least a first or last name." };
    }
    const mobileDigits = input.mobileNo.replace(/\D/g, "");
    const mobileErr = validateMobile(mobileDigits);
    if (mobileErr) return { ok: false, error: mobileErr };

    // Mobile uniqueness check
    if (mobileDigits.length === 10) {
      const { data: existing } = await admin
        .from("player_contacts")
        .select("player_id")
        .eq("tournament_id", input.tournamentId)
        .eq("mobile_no", mobileDigits)
        .maybeSingle();
      if (existing) {
        return { ok: false, error: "This mobile number is already registered." };
      }
    }

    // Upload photo if provided
    let photoUrl: string | null = null;
    if (input.photoDataUrl) {
      try {
        const up = await uploadPlayerPhoto(input.tournamentId, input.photoDataUrl);
        photoUrl = up.url;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Photo upload failed.";
        return { ok: false, error: msg };
      }
    }

    const { data: inserted, error: insErr } = await admin
      .from("players")
      .insert({
        tournament_id: input.tournamentId,
        first_name: first || null,
        surname: last || null,
        full_name: buildFullName(first, last),
        jersey_no: input.jerseyNo,
        jersey_size: input.jerseySize,
        category: input.category,
        current_team: input.currentTeam,
        photo_url: photoUrl,
        base_price: input.basePrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return { ok: false, error: insErr?.message ?? "Could not create player." };
    }

    if (mobileDigits.length === 10) {
      const { error: cErr } = await admin.from("player_contacts").insert({
        player_id: inserted.id,
        tournament_id: input.tournamentId,
        mobile_no: mobileDigits,
      });
      if (cErr) {
        // Roll back the player insert
        await admin.from("players").delete().eq("id", inserted.id);
        const dup =
          cErr.message.toLowerCase().includes("duplicate") ||
          cErr.message.toLowerCase().includes("unique");
        return {
          ok: false,
          error: dup
            ? "This mobile number is already registered."
            : "Could not save contact info.",
        };
      }
    }

    revalidatePath(`/admin/${input.tournamentId}`);
    revalidatePath(`/admin/${input.tournamentId}/live`);
    return { ok: true, data: { id: inserted.id } };
  } catch (e) {
    console.error("adminCreatePlayerAction failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function adminUpdatePlayerAction(
  input: UpdatePlayerInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("players")
      .select("id, photo_url, tournament_id")
      .eq("id", input.playerId)
      .eq("tournament_id", input.tournamentId)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Player not found." };

    const first = input.firstName.trim();
    const last = input.surname.trim();
    if (!first && !last) {
      return { ok: false, error: "Provide at least a first or last name." };
    }
    const mobileDigits = input.mobileNo.replace(/\D/g, "");
    const mobileErr = validateMobile(mobileDigits);
    if (mobileErr) return { ok: false, error: mobileErr };

    // Mobile uniqueness check excluding self
    if (mobileDigits.length === 10) {
      const { data: dup } = await admin
        .from("player_contacts")
        .select("player_id")
        .eq("tournament_id", input.tournamentId)
        .eq("mobile_no", mobileDigits)
        .neq("player_id", input.playerId)
        .maybeSingle();
      if (dup) return { ok: false, error: "This mobile number is used by another player." };
    }

    // Photo handling
    let photoUrl: string | null | undefined = undefined;
    if (input.clearPhoto) {
      photoUrl = null;
    } else if (input.photoDataUrl) {
      try {
        const up = await uploadPlayerPhoto(input.tournamentId, input.photoDataUrl);
        photoUrl = up.url;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Photo upload failed.";
        return { ok: false, error: msg };
      }
    }

    const patch: TablesUpdate<"players"> = {
      first_name: first || null,
      surname: last || null,
      full_name: buildFullName(first, last),
      jersey_no: input.jerseyNo,
      jersey_size: input.jerseySize,
      category: input.category,
      current_team: input.currentTeam,
      base_price: input.basePrice,
    };
    if (photoUrl !== undefined) {
      patch.photo_url = photoUrl;
    }

    const { error: updErr } = await admin
      .from("players")
      .update(patch)
      .eq("id", input.playerId);
    if (updErr) return { ok: false, error: updErr.message };

    // Contact handling
    if (mobileDigits.length === 10) {
      const { error: cErr } = await admin
        .from("player_contacts")
        .upsert(
          {
            player_id: input.playerId,
            tournament_id: input.tournamentId,
            mobile_no: mobileDigits,
          },
          { onConflict: "player_id" },
        );
      if (cErr) {
        const dup =
          cErr.message.toLowerCase().includes("duplicate") ||
          cErr.message.toLowerCase().includes("unique");
        return {
          ok: false,
          error: dup ? "This mobile number is used by another player." : cErr.message,
        };
      }
    } else {
      // Blank mobile — remove contact row if present
      await admin.from("player_contacts").delete().eq("player_id", input.playerId);
    }

    revalidatePath(`/admin/${input.tournamentId}`);
    revalidatePath(`/admin/${input.tournamentId}/live`);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("adminUpdatePlayerAction failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function adminDeletePlayerAction(
  playerId: string,
  tournamentId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: player } = await admin
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (!player) return { ok: false, error: "Player not found." };

    // Refund team if sold
    if (player.status === "sold" && player.sold_to_team_id && player.selling_price) {
      const { data: team } = await admin
        .from("teams")
        .select("points_remaining")
        .eq("id", player.sold_to_team_id)
        .maybeSingle();
      if (team) {
        await admin
          .from("teams")
          .update({ points_remaining: team.points_remaining + player.selling_price })
          .eq("id", player.sold_to_team_id);
      }
    }

    // Clear auction state if this player was on block
    if (player.status === "on_block") {
      await admin
        .from("auction_state")
        .update({
          current_player_id: null,
          current_bid_price: 0,
          current_highest_team_id: null,
          shuffling_name: null,
        })
        .eq("tournament_id", tournamentId)
        .eq("current_player_id", playerId);
    }

    // Delete (cascades to player_contacts + group members via FK)
    const { error: delErr } = await admin.from("players").delete().eq("id", playerId);
    if (delErr) return { ok: false, error: delErr.message };

    revalidatePath(`/admin/${tournamentId}`);
    revalidatePath(`/admin/${tournamentId}/live`);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("adminDeletePlayerAction failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}