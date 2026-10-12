/**
 * CRICZONE — max bid calculation.
 *
 * A team must be able to afford the minimum bid for every remaining
 * slot it wants to fill. So the maximum they can bid on the *current*
 * player is:
 *
 *   points_remaining − (slots_remaining − 1) × min_per_slot
 *
 * `min_per_slot` is:
 *   * star mode  → the tournament's configured star base price (e.g. 1000)
 *   * normal mode → 1 pt
 *
 * Returns:
 *   * a non-negative number  → the max bid for the current player
 *   * -1                     → squad is full (cannot bid)
 *
 * Star + normal modes recalculate automatically when the mode changes —
 * this is a pure function, no caching.
 */

export type BidMode = "normal" | "star";

export const SQUAD_FULL = -1;

export function calculateMaxBid(
  pointsRemaining: number,
  slotsRemaining: number | null,
  bidMode: BidMode,
  starBasePrice: number,
): number {
  // No slot cap → they can spend everything they have
  if (slotsRemaining === null) {
    return Math.max(0, pointsRemaining);
  }

  // Full squad → cannot bid
  if (slotsRemaining <= 0) {
    return SQUAD_FULL;
  }

  const minPerSlot = bidMode === "star" ? Math.max(1, starBasePrice) : 1;
  const reserved = (slotsRemaining - 1) * minPerSlot;
  const maxBid = pointsRemaining - reserved;

  return Math.max(0, maxBid);
}

/**
 * Human-friendly label for the badge — handles the squad-full case
 * and normalises small numbers.
 */
export function formatMaxBid(maxBid: number): string {
  if (maxBid === SQUAD_FULL) return "Squad Full";
  // Trim trailing .0 in normal mode decimals (e.g. 46000.0 → 46000)
  return maxBid % 1 === 0 ? String(maxBid) : maxBid.toFixed(1);
}