import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getAdminTournamentDetail } from "@/lib/queries/admin";
import { LiveControlPanel } from "@/components/admin/live/LiveControlPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LivePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminTournamentDetail(id);
  if (!detail) notFound();

  return (
    <LiveControlPanel
      tournament={detail.tournament}
      initialState={detail.state}
      initialPlayers={detail.players}
      initialTeams={detail.teams}
      initialGroups={detail.groups}
    />
  );
}