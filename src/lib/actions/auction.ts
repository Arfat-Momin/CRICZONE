"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionResult } from "./tournament";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

export async function putOnBlockAction(
  tournamentId: string,
  playerId: string,
): Promise<ActionResult<{ playerId: string; playerName: string }>> {
  try {
    const { supabase } = await requireAdmin();

    const { data: player } = await supabase
      .from("players")
      .select("id, full_name, status, tournament_id")
      .eq("id", playerId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    if (!player) return { ok: false, error: "Player not found." };
    if (player.status !== "pending" && player.status !== "unsold") {
      return {
        ok: false,
        error: `${player.full_name} cannot be put on block (status: ${player.status}).`,
      };
    }

    const { error } = await supabase.rpc("start_shuffle", {
      p_tournament_id: tournamentId,
      p_shuffling_name: player.full_name,
    });
    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: { playerId: player.id, playerName: player.full_name },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function finalizeOnBlockAction(
  tournamentId: string,
  playerId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("finalize_on_block", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function placeBidAction(
  tournamentId: string,
  teamId: string,
): Promise<ActionResult<{ nextBid: number }>> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.rpc("place_bid", {
      p_tournament_id: tournamentId,
      p_team_id: teamId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { nextBid: Number(data) } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function revertLastBidAction(
  tournamentId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("revert_last_bid", {
      p_tournament_id: tournamentId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function sellPlayerAction(
  tournamentId: string,
  playerId: string,
  teamId: string,
  price: number,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (price <= 0) return { ok: false, error: "Price must be greater than 0." };
    const { error } = await supabase.rpc("sell_player", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
      p_team_id: teamId,
      p_price: price,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/${tournamentId}/live`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function passPlayerAction(
  tournamentId: string,
  playerId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("pass_player", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function revertSaleAction(
  tournamentId: string,
  playerId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("revert_sale", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export type _AuctionActionResultOk<T> = Ok<T>;
export type _AuctionActionResultErr = Err;