import { z } from "zod";

const mobileRegex = /^\d{10}$/;

export const PlayerRegistrationInput = z
  .object({
    tournamentId: z.string().uuid(),
    firstName: z.string().trim().min(1, "First name is required").max(60),
    surname: z.string().trim().min(1, "Surname is required").max(60),
    mobileNo: z.string().trim().regex(mobileRegex, "10-digit mobile required"),
    jerseyNo: z.number().int().min(1).max(999),
    jerseySize: z.string().trim().min(1).max(10),
    category: z.string().trim().min(1).max(60),
    currentTeam: z.string().trim().max(120).optional(),
    photoUrl: z.string().url().max(2000),
    customFields: z.unknown().optional(),
  })
  .strict();
export type PlayerRegistrationInput = z.infer<typeof PlayerRegistrationInput>;