import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { DangerZone } from "@/components/admin/DangerZone";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DangerPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!tournament) notFound();

  const [playersRes, teamsRes] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
  ]);

  return (
    <DangerZone
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      playerCount={playersRes.count ?? 0}
      teamCount={teamsRes.count ?? 0}
    />
  );
}