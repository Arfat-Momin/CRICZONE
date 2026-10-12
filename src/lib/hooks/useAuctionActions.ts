"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

function rpcErrorToMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: string }).message;
    if (m) return m;
  }
  return fallback;
}

/**
 * Direct browser-side RPC wrappers.
 *
 * Why bypass the server action:
 *   - place_bid / sell_player / pass_player / revert_last_bid / revert_sale
 *     are all `security definer` functions that enforce `is_admin()` internally.
 *     Non-admins get UNAUTHORIZED.
 *   - Calling them directly from the admin's authenticated browser session
 *     skips the ~200-400ms server-action round-trip (cookies + auth middleware).
 *
 * Falls back to the error message returned by the RPC.
 */

export async function browserPlaceBid(
  tournamentId: string,
  teamId: string,
): Promise<Ok<{ nextBid: number }> | Err> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("place_bid", {
      p_tournament_id: tournamentId,
      p_team_id: teamId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { nextBid: Number(data) } };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Bid failed") };
  }
}

export async function browserRevertLastBid(
  tournamentId: string,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("revert_last_bid", {
      p_tournament_id: tournamentId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Revert failed") };
  }
}

export async function browserSellPlayer(
  tournamentId: string,
  playerId: string,
  teamId: string,
  price: number,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("sell_player", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
      p_team_id: teamId,
      p_price: price,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Sell failed") };
  }
}

export async function browserPassPlayer(
  tournamentId: string,
  playerId: string,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("pass_player", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Pass failed") };
  }
}

export async function browserRevertSale(
  tournamentId: string,
  playerId: string,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("revert_sale", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Revert sale failed") };
  }
}

export type StarConfig = {
  basePrice: number;
  increment: number;
  doubleEnabled: boolean;
  doubleAfterBids: number;
  bidCount: number;
};

/**
 * Compute the next bid on the client (mirrors the SQL logic in `place_bid`).
 * Used for optimistic UI so the admin sees their bid instantly.
 */
export function computeNextBid(
  currentBid: number,
  mode: Tables<"auction_state">["bid_mode"],
  starConfig?: StarConfig | null,
): number {
  if (mode === "star") {
    // Fallback to legacy 1000-pt behavior if config is missing
    if (!starConfig) {
      return currentBid === 0 ? 1000 : currentBid + 1000;
    }
    if (currentBid === 0) return starConfig.basePrice;
    const inc =
      starConfig.doubleEnabled &&
      starConfig.bidCount >= starConfig.doubleAfterBids
        ? starConfig.increment * 2
        : starConfig.increment;
    return currentBid + inc;
  }
  // Normal mode
  if (currentBid === 0) return 1;
  if (currentBid < 5) return currentBid + 0.5;
  return currentBid + 1;
}

export async function browserUpdateStarConfig(
  tournamentId: string,
  config: Omit<StarConfig, "bidCount">,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("update_star_config", {
      p_tournament_id: tournamentId,
      p_base_price: config.basePrice,
      p_increment: config.increment,
      p_double_enabled: config.doubleEnabled,
      p_double_after: config.doubleAfterBids,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Star config save failed") };
  }
}
export async function browserStartShuffle(
  tournamentId: string,
  shufflingName: string,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("start_shuffle", {
      p_tournament_id: tournamentId,
      p_shuffling_name: shufflingName,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Start shuffle failed") };
  }
}

export async function browserFinalizeOnBlock(
  tournamentId: string,
  playerId: string,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("finalize_on_block", {
      p_tournament_id: tournamentId,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: rpcErrorToMessage(e, "Finalize failed") };
  }
}
export async function browserSetShuffleEnabled(
  tournamentId: string,
  enabled: boolean,
): Promise<Ok<undefined> | Err> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("set_shuffle_enabled", {
      p_tournament_id: tournamentId,
      p_enabled: enabled,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: undefined };
  } catch (e) {
    return {
      ok: false,
      error: rpcErrorToMessage(e, "Shuffle toggle failed"),
    };
  }
}