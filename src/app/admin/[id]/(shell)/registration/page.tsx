import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { getTournamentHeader } from "@/lib/queries/tournament-header";
import { FormBuilderSection } from "@/components/admin/forms/FormBuilderSection";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RegistrationPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Cached header + form_config in parallel
  const [tournament, formRes] = await Promise.all([
    getTournamentHeader(id),
    supabase
      .from("tournaments")
      .select("form_config")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!tournament) notFound();

  const formConfig = normalizeFormConfig(
    formRes.data?.form_config ?? null,
    tournament.name,
  );

  return (
    <div>
      <header className="mb-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          Registration Form
        </h2>
        <p className="mt-1 text-sm text-[#1B4332]/60">
          Configure fields, preview, and control visibility of the public form.
        </p>
      </header>
      <FormBuilderSection
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        initialConfig={formConfig}
      />
    </div>
  );
}