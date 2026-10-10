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

/**
 * Compute the next bid on the client (mirrors the SQL logic in `place_bid`).
 * Used for optimistic UI so the admin sees their bid instantly.
 */
export function computeNextBid(
  currentBid: number,
  mode: Tables<"auction_state">["bid_mode"],
): number {
  if (mode === "star") {
    return currentBid === 0 ? 1000 : currentBid + 1000;
  }
  if (currentBid === 0) return 1;
  if (currentBid < 5) return currentBid + 0.5;
  return currentBid + 1;
}