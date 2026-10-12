import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { getTournamentHeader } from "@/lib/queries/tournament-header";
import { GroupsSection } from "@/components/admin/GroupsSection";
import { getTournamentGroups } from "@/lib/queries/groups";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GroupsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Cached header + groups + players in parallel
  const [tournament, groups, playersRes] = await Promise.all([
    getTournamentHeader(id),
    getTournamentGroups(id),
    supabase
      .from("players")
      .select("*")
      .eq("tournament_id", id)
      .order("full_name", { ascending: true }),
  ]);

  if (!tournament) notFound();

  const players = (playersRes.data ?? []).map((p) => ({
    ...p,
    mobile_no: null as string | null,
  }));

  // grouping_enabled is not in the header; fetch just that flag
  const { data: flag } = await supabase
    .from("tournaments")
    .select("grouping_enabled")
    .eq("id", id)
    .maybeSingle();

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
        groupingEnabled={flag?.grouping_enabled === true}
        players={players}
        groups={groups}
      />
    </div>
  );
}