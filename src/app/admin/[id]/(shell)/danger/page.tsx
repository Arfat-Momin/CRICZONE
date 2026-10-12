import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { getTournamentHeader } from "@/lib/queries/tournament-header";
import { DangerZone } from "@/components/admin/DangerZone";
import type { Tables } from "@/types/supabase";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type ContactRow = { mobile_no: string } | { mobile_no: string }[] | null;
type PlayerRow = Tables<"players"> & { player_contacts: ContactRow };

export default async function DangerPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [tournament, playersRes, teamsRes] = await Promise.all([
    getTournamentHeader(id),
    supabase
      .from("players")
      .select("*, player_contacts(mobile_no)")
      .eq("tournament_id", id)
      .order("full_name", { ascending: true }),
    supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id)
      .order("team_name", { ascending: true }),
  ]);

  if (!tournament) notFound();

  const players = ((playersRes.data ?? []) as unknown as PlayerRow[]).map((p) => {
    const contacts = p.player_contacts;
    let mobile: string | null = null;
    if (Array.isArray(contacts)) mobile = contacts[0]?.mobile_no ?? null;
    else if (contacts) mobile = contacts.mobile_no ?? null;
    const { player_contacts: _unused, ...rest } = p;
    return { ...rest, mobile_no: mobile };
  });

  return (
    <DangerZone
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      players={players}
      teams={teamsRes.data ?? []}
    />
  );
}