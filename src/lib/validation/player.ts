import { z } from "zod";
import { PlayerStatus } from "./enums";

export const CreatePlayerInput = z
  .object({
    tournamentId: z.string().uuid(),
    firstName: z.string().trim().max(60).optional(),
    surname: z.string().trim().max(60).optional(),
    fullName: z.string().trim().min(1).max(120),
    mobileNo: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "10 digits required")
      .optional(),
    jerseyNo: z.number().int().min(1).max(999).nullable().optional(),
    jerseySize: z.string().trim().max(10).nullable().optional(),
    category: z.string().trim().max(60).nullable().optional(),
    currentTeam: z.string().trim().max(120).nullable().optional(),
    photoUrl: z.string().url().max(2000).nullable().optional(),
    basePrice: z.number().min(0).max(100000).default(1),
    status: PlayerStatus.default("pending"),
    customFields: z.unknown().optional(),
  })
  .strict();
export type CreatePlayerInput = z.infer<typeof CreatePlayerInput>;

export const UpdatePlayerInput = z
  .object({
    firstName: z.string().trim().max(60).nullable().optional(),
    surname: z.string().trim().max(60).nullable().optional(),
    fullName: z.string().trim().min(1).max(120).optional(),
    mobileNo: z.string().trim().regex(/^\d{10}$/).nullable().optional(),
    jerseyNo: z.number().int().min(1).max(999).nullable().optional(),
    jerseySize: z.string().trim().max(10).nullable().optional(),
    category: z.string().trim().max(60).nullable().optional(),
    currentTeam: z.string().trim().max(120).nullable().optional(),
    photoUrl: z.string().url().max(2000).nullable().optional(),
    basePrice: z.number().min(0).max(100000).optional(),
    status: PlayerStatus.optional(),
    customFields: z.unknown().optional(),
  })
  .strict();
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerInput>;