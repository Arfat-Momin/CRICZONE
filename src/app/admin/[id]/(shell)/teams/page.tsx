import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { CreateTeamForm } from "@/components/admin/CreateTeamForm";
import { DeleteTeamButton } from "@/components/admin/DeleteTeamButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TeamsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [tournamentRes, teamsRes] = await Promise.all([
    supabase.from("tournaments").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id)
      .order("team_name", { ascending: true }),
  ]);

  if (!tournamentRes.data) notFound();
  const tournament = tournamentRes.data;
  const safeTeams = teamsRes.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          Teams ({safeTeams.length})
        </h2>
        <p className="mt-1 text-sm text-[#1B4332]/60">
          Add captains, set starting points and squad limits.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {safeTeams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-8 text-center text-sm text-[#1B4332]/60">
              No teams yet. Add one &rarr;
            </div>
          ) : (
            <ul className="space-y-2">
              {safeTeams.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-[#1B4332]/10 bg-white p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {t.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full border border-[#1B4332]/15 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-forest">
                        {(t.team_name[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-forest">
                        {t.team_name}
                      </p>
                      <p className="truncate text-xs text-[#1B4332]/60">
                        {t.captain_name ?? "—"} · {t.points_remaining} pts
                        {t.max_players ? ` · max ${t.max_players}` : ""}
                      </p>
                    </div>
                  </div>
                  <DeleteTeamButton
                    teamId={t.id}
                    tournamentId={tournament.id}
                    teamName={t.team_name}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <CreateTeamForm tournamentId={tournament.id} />
        </aside>
      </div>
    </div>
  );
}