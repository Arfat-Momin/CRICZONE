"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveImageInput } from "@/lib/storage/upload-photo";
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
  /** Data URL (upload) OR http(s) URL. Null for none. */
  photoInput: string | null;
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
  /** Data URL OR http(s) URL — replaces existing if provided. */
  photoInput: string | null;
  /** If true, clears the existing photo (photoInput ignored). */
  clearPhoto: boolean;
};

function buildFullName(first: string, last: string): string {
  const full = `${first} ${last}`.trim();
  return full || first || last || "Player";
}

function validateMobile(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 0) return null;
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

    let photoUrl: string | null = null;
    if (input.photoInput) {
      try {
        const resolved = await resolveImageInput(
          input.tournamentId,
          input.photoInput,
          "player",
        );
        photoUrl = resolved.url;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Photo processing failed.";
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

    revalidatePath(`/admin/${input.tournamentId}/players`);
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

    // Photo: clear / replace / leave-unchanged
    let photoUrl: string | null | undefined = undefined;
    if (input.clearPhoto) {
      photoUrl = null;
    } else if (input.photoInput) {
      try {
        const resolved = await resolveImageInput(
          input.tournamentId,
          input.photoInput,
          "player",
        );
        photoUrl = resolved.url;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Photo processing failed.";
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
      await admin.from("player_contacts").delete().eq("player_id", input.playerId);
    }

    revalidatePath(`/admin/${input.tournamentId}/players`);
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

    const { error: delErr } = await admin.from("players").delete().eq("id", playerId);
    if (delErr) return { ok: false, error: delErr.message };

    revalidatePath(`/admin/${tournamentId}/players`);
    revalidatePath(`/admin/${tournamentId}/live`);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("adminDeletePlayerAction failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}