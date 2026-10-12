import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { getTournamentHeader } from "@/lib/queries/tournament-header";
import { DangerZone } from "@/components/admin/DangerZone";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DangerPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Cached header + counts in parallel
  const [tournament, playersRes, teamsRes] = await Promise.all([
    getTournamentHeader(id),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
  ]);

  if (!tournament) notFound();

  return (
    <DangerZone
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      playerCount={playersRes.count ?? 0}
      teamCount={teamsRes.count ?? 0}
    />
  );
}