import { z } from "zod";

export const CreateTeamInput = z
  .object({
    tournamentId: z.string().uuid(),
    teamName: z.string().trim().min(2).max(60),
    captainName: z.string().trim().max(60).optional(),
    photoUrl: z.string().url().max(2000).optional(),
    pointsRemaining: z.number().int().min(0).max(100000).default(100),
    maxPlayers: z.number().int().min(1).max(50).nullable().optional(),
  })
  .strict();
export type CreateTeamInput = z.infer<typeof CreateTeamInput>;

export const UpdateTeamInput = z
  .object({
    teamName: z.string().trim().min(2).max(60).optional(),
    captainName: z.string().trim().max(60).nullable().optional(),
    photoUrl: z.string().url().max(2000).nullable().optional(),
    pointsRemaining: z.number().int().min(0).max(100000).optional(),
    maxPlayers: z.number().int().min(1).max(50).nullable().optional(),
  })
  .strict();
export type UpdateTeamInput = z.infer<typeof UpdateTeamInput>;