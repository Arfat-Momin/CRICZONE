import { z } from "zod";

export const CreateGroupInput = z
  .object({
    tournamentId: z.string().uuid(),
    name: z.string().trim().min(1).max(60),
    sortOrder: z.number().int().min(0).default(0),
    playerIds: z.array(z.string().uuid()).min(1),
  })
  .strict();
export type CreateGroupInput = z.infer<typeof CreateGroupInput>;