import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getTournamentHeader } from "@/lib/queries/tournament-header";
import { AdminTournamentShell } from "@/components/admin/AdminTournamentShell";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ShellLayout({ children, params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const tournament = await getTournamentHeader(id);
  if (!tournament) notFound();

  return (
    <AdminTournamentShell
      tournament={{
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        status: tournament.status,
        venue: tournament.venue,
      }}
    >
      {children}
    </AdminTournamentShell>
  );
}