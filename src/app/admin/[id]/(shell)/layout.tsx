import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { AdminTournamentShell } from "@/components/admin/AdminTournamentShell";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ShellLayout({ children, params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, slug, status, venue")
    .eq("id", id)
    .maybeSingle();

  if (!tournament) notFound();

  return (
    <AdminTournamentShell tournament={tournament}>{children}</AdminTournamentShell>
  );
}