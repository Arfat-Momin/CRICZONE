import { z } from "zod";
import { TournamentStatus } from "./enums";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateTournamentInput = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(slugRegex, "Lowercase letters, numbers, hyphens only"),
    venue: z.string().trim().max(120).optional(),
    auctionStartAt: z.string().datetime().nullable().optional(),
  })
  .strict();
export type CreateTournamentInput = z.infer<typeof CreateTournamentInput>;

export const UpdateTournamentInput = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    venue: z.string().trim().max(120).optional(),
    auctionStartAt: z.string().datetime().nullable().optional(),
    status: TournamentStatus.optional(),
    registrationEnabled: z.boolean().optional(),
    groupingEnabled: z.boolean().optional(),
    formConfig: z.unknown().optional(),
  })
  .strict();
export type UpdateTournamentInput = z.infer<typeof UpdateTournamentInput>;