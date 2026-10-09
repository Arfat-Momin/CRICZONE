import { z } from "zod";

export const StartShuffleInput = z
  .object({
    tournamentId: z.string().uuid(),
    shufflingName: z.string().trim().min(1).max(120),
  })
  .strict();
export type StartShuffleInput = z.infer<typeof StartShuffleInput>;

export const FinalizeOnBlockInput = z
  .object({
    tournamentId: z.string().uuid(),
    playerId: z.string().uuid(),
  })
  .strict();
export type FinalizeOnBlockInput = z.infer<typeof FinalizeOnBlockInput>;

export const PlaceBidInput = z
  .object({
    tournamentId: z.string().uuid(),
    teamId: z.string().uuid(),
  })
  .strict();
export type PlaceBidInput = z.infer<typeof PlaceBidInput>;

export const SellPlayerInput = z
  .object({
    tournamentId: z.string().uuid(),
    playerId: z.string().uuid(),
    teamId: z.string().uuid(),
    price: z.number().positive(),
  })
  .strict();
export type SellPlayerInput = z.infer<typeof SellPlayerInput>;

export const PassPlayerInput = z
  .object({
    tournamentId: z.string().uuid(),
    playerId: z.string().uuid(),
  })
  .strict();
export type PassPlayerInput = z.infer<typeof PassPlayerInput>;

export const RevertLastBidInput = z
  .object({
    tournamentId: z.string().uuid(),
  })
  .strict();
export type RevertLastBidInput = z.infer<typeof RevertLastBidInput>;

export const RevertSaleInput = z
  .object({
    tournamentId: z.string().uuid(),
    playerId: z.string().uuid(),
  })
  .strict();
export type RevertSaleInput = z.infer<typeof RevertSaleInput>;