import { z } from "zod";

export const TournamentStatus = z.enum([
  "draft",
  "registration",
  "ready",
  "live",
  "ended",
  "archived",
]);
export type TournamentStatus = z.infer<typeof TournamentStatus>;

export const PlayerStatus = z.enum([
  "pending",
  "on_block",
  "sold",
  "unsold",
  "skipped",
]);
export type PlayerStatus = z.infer<typeof PlayerStatus>;

export const BidMode = z.enum(["normal", "star"]);
export type BidMode = z.infer<typeof BidMode>;