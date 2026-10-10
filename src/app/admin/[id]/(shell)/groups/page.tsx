import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { GroupsSection } from "@/components/admin/GroupsSection";
import { getTournamentGroups } from "@/lib/queries/groups";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GroupsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, grouping_enabled")
    .eq("id", id)
    .maybeSingle();
  if (!tournament) notFound();

  const [groups, playersRes] = await Promise.all([
    getTournamentGroups(id),
    supabase
      .from("players")
      .select("*")
      .eq("tournament_id", id)
      .order("full_name", { ascending: true }),
  ]);

  const players = (playersRes.data ?? []).map((p) => ({
    ...p,
    mobile_no: null as string | null,
  }));

  return (
    <div>
      <header className="mb-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          Player Groups
        </h2>
        <p className="mt-1 text-sm text-[#1B4332]/60">
          Draw players in batches. Each player belongs to at most one group.
        </p>
      </header>
      <GroupsSection
        tournamentId={tournament.id}
        groupingEnabled={tournament.grouping_enabled}
        players={players}
        groups={groups}
      />
    </div>
  );
}