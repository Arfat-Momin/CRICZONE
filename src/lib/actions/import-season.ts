"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/supabase";

type ImportPlayersInput = {
  targetTournamentId: string;
  sourceTournamentId: string;
  playerIds: string[];
};

type ImportTeamsInput = {
  targetTournamentId: string;
  sourceTournamentId: string;
  teamIds: string[];
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

const MAX_PLAYERS_PER_IMPORT = 100;

type ContactRow = { mobile_no: string } | { mobile_no: string }[] | null;

type PlayerRowWithContacts = Tables<"players"> & {
  player_contacts: ContactRow;
};

function extractMobile(row: PlayerRowWithContacts): string | null {
  const c = row.player_contacts;
  if (!c) return null;
  if (Array.isArray(c)) return c[0]?.mobile_no ?? null;
  return c.mobile_no ?? null;
}

export async function importPlayersAction(
  input: ImportPlayersInput,
): Promise<{ ok: true; data: ImportResult } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    if (input.sourceTournamentId === input.targetTournamentId) {
      return { ok: false, error: "Source and target tournaments are the same." };
    }
    if (input.playerIds.length === 0) {
      return { ok: false, error: "No players selected." };
    }
    if (input.playerIds.length > MAX_PLAYERS_PER_IMPORT) {
      return {
        ok: false,
        error: `Import capped at ${MAX_PLAYERS_PER_IMPORT} players per batch.`,
      };
    }

    // Load source players with mobile numbers (admin can read any tournament)
    const { data: rawPlayers, error: sErr } = await admin
      .from("players")
      .select("*, player_contacts(mobile_no)")
      .eq("tournament_id", input.sourceTournamentId)
      .in("id", input.playerIds);

    if (sErr) return { ok: false, error: sErr.message };
    const players = (rawPlayers ?? []) as unknown as PlayerRowWithContacts[];
    if (players.length === 0) return { ok: false, error: "No matching source players." };

    // Preload target mobile numbers
    const { data: existingContacts } = await admin
      .from("player_contacts")
      .select("mobile_no")
      .eq("tournament_id", input.targetTournamentId);
    const existingMobiles = new Set((existingContacts ?? []).map((c) => c.mobile_no));

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const src of players) {
      try {
        const mobile = extractMobile(src);

        if (mobile && existingMobiles.has(mobile)) {
          skipped++;
          continue;
        }

        const { data: inserted, error: insErr } = await admin
          .from("players")
          .insert({
            tournament_id: input.targetTournamentId,
            first_name: src.first_name,
            surname: src.surname,
            full_name: src.full_name,
            jersey_no: src.jersey_no,
            jersey_size: src.jersey_size,
            category: src.category,
            current_team: src.current_team,
            photo_url: src.photo_url,
            base_price: src.base_price,
            status: "pending",
          })
          .select("id")
          .single();

        if (insErr || !inserted) {
          errors.push(`${src.full_name}: ${insErr?.message ?? "insert failed"}`);
          continue;
        }

        if (mobile) {
          const { error: cErr } = await admin.from("player_contacts").insert({
            player_id: inserted.id,
            tournament_id: input.targetTournamentId,
            mobile_no: mobile,
          });
          if (cErr) {
            await admin.from("players").delete().eq("id", inserted.id);
            if (
              cErr.message.toLowerCase().includes("duplicate") ||
              cErr.message.toLowerCase().includes("unique")
            ) {
              skipped++;
            } else {
              errors.push(`${src.full_name}: ${cErr.message}`);
            }
            continue;
          }
          existingMobiles.add(mobile);
        }

        imported++;
      } catch (e) {
        errors.push(
          `${src.full_name}: ${e instanceof Error ? e.message : "unknown error"}`,
        );
      }
    }

    revalidatePath(`/admin/${input.targetTournamentId}`);
    return { ok: true, data: { imported, skipped, errors } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}

export async function importTeamsAction(
  input: ImportTeamsInput,
): Promise<{ ok: true; data: ImportResult } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    if (input.sourceTournamentId === input.targetTournamentId) {
      return { ok: false, error: "Source and target tournaments are the same." };
    }
    if (input.teamIds.length === 0) {
      return { ok: false, error: "No teams selected." };
    }

    const { data: srcTeams, error: sErr } = await admin
      .from("teams")
      .select("*")
      .eq("tournament_id", input.sourceTournamentId)
      .in("id", input.teamIds);

    if (sErr) return { ok: false, error: sErr.message };
    if (!srcTeams || srcTeams.length === 0) {
      return { ok: false, error: "No matching source teams." };
    }

    // Preload existing team names in the target
    const { data: existingTeams } = await admin
      .from("teams")
      .select("team_name")
      .eq("tournament_id", input.targetTournamentId);
    const existingNames = new Set(
      (existingTeams ?? []).map((t) => t.team_name.toLowerCase()),
    );

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const team of srcTeams) {
      try {
        if (existingNames.has(team.team_name.toLowerCase())) {
          skipped++;
          continue;
        }

        const { error: insErr } = await admin.from("teams").insert({
          tournament_id: input.targetTournamentId,
          team_name: team.team_name,
          captain_name: team.captain_name,
          photo_url: team.photo_url,
          points_remaining: 100,
          max_players: team.max_players,
        });

        if (insErr) {
          const dup =
            insErr.message.toLowerCase().includes("duplicate") ||
            insErr.message.toLowerCase().includes("unique");
          if (dup) skipped++;
          else errors.push(`${team.team_name}: ${insErr.message}`);
          continue;
        }

        existingNames.add(team.team_name.toLowerCase());
        imported++;
      } catch (e) {
        errors.push(
          `${team.team_name}: ${e instanceof Error ? e.message : "unknown error"}`,
        );
      }
    }

    revalidatePath(`/admin/${input.targetTournamentId}`);
    return { ok: true, data: { imported, skipped, errors } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error.",
    };
  }
}