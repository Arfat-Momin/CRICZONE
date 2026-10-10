import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getAdminTournamentDetail } from "@/lib/queries/admin";
import { CreateTeamForm } from "@/components/admin/CreateTeamForm";
import { DeleteTeamButton } from "@/components/admin/DeleteTeamButton";
import { TournamentStatusSelect } from "@/components/admin/TournamentStatusSelect";
import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { ReadOnlyUrlField } from "@/components/admin/ReadOnlyUrlField";
import { ExportPdfButton } from "@/components/admin/ExportPdfButton";
import { DangerZone } from "@/components/admin/DangerZone";
import { AdminPlayerSection } from "@/components/admin/AdminPlayerSection";
import { FormBuilderSection } from "@/components/admin/forms/FormBuilderSection";
import { normalizeFormConfig } from "@/lib/tournament/form-config";
import { GroupsSection } from "@/components/admin/GroupsSection";
import { TournamentActionsBar } from "@/components/admin/TournamentActionsBar";
import { getTournamentGroups } from "@/lib/queries/groups";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTournamentPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const data = await getAdminTournamentDetail(id);
  if (!data) notFound();

  const { tournament, players, teams } = data;
  const groups = await getTournamentGroups(tournament.id);
  const formConfig = normalizeFormConfig(tournament.form_config, tournament.name);
  const auctionUrl = `${getSiteUrl()}/t/${tournament.slug}`;
  const registerUrl = `${getSiteUrl()}/t/${tournament.slug}/register`;

  return (
    <main className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="border-b border-[#1B4332]/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/admin/dashboard"
            className="text-sm font-bold text-[#2D6A4F] hover:underline"
          >
            &larr; All Tournaments
          </Link>
          <DeleteTournamentButton
            tournamentId={tournament.id}
            tournamentName={tournament.name}
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <TournamentStatusSelect
                tournamentId={tournament.id}
                current={tournament.status}
              />
              <span className="text-xs font-semibold text-[#1B4332]/60">
                Registration:{" "}
                {tournament.registration_enabled ? "Open" : "Closed"}
              </span>
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-forest md:text-4xl">
              {tournament.name}
            </h1>
            <div className="mt-2 space-y-0.5 text-sm text-[#1B4332]/65">
              {tournament.venue && <p>📍 {tournament.venue}</p>}
              {tournament.auction_start_at && (
                <p>
                  📅{" "}
                  {format(
                    new Date(tournament.auction_start_at),
                    "EEE, MMM d, yyyy · h:mm a",
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:w-[340px]">
            <div className="grid grid-cols-2 gap-2">
              <a
                href={auctionUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-forest px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-cream transition hover:bg-[#2D6A4F]"
              >
                Open Public &rarr;
              </a>
              <Link
                href={`/admin/${tournament.id}/live`}
                className="rounded-lg bg-sold px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
              >
                Live Control &rarr;
              </Link>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
                Auction / Live Link
              </p>
              <ReadOnlyUrlField value={auctionUrl} buttonLabel="Copy" />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
                Registration Link
              </p>
              <ReadOnlyUrlField value={registerUrl} buttonLabel="Copy" />
            </div>

            <a
              href={`/api/admin/tournaments/${tournament.id}/export`}
              className="rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
            >
              ⬇ Export Players CSV
            </a>
            <ExportPdfButton tournamentId={tournament.id} />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Players" value={players.length} />
          <StatCard label="Teams" value={teams.length} />
          <StatCard
            label="Status"
            value={
              tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)
            }
          />
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
              Teams ({teams.length})
            </h2>
            {teams.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-8 text-center text-sm text-[#1B4332]/60">
                No teams added yet. Add one &rarr;
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {teams.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-[#1B4332]/10 bg-white p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-forest">{t.team_name}</p>
                      <p className="truncate text-xs text-[#1B4332]/60">
                        {t.captain_name ?? "—"} · {t.points_remaining} pts
                        {t.max_players ? ` · max ${t.max_players}` : ""}
                      </p>
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
          </section>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <CreateTeamForm tournamentId={tournament.id} />
          </aside>
        </div>

        <TournamentActionsBar
          tournamentId={tournament.id}
          auctionUrl={auctionUrl}
          registerUrl={registerUrl}
        />

        <GroupsSection
          tournamentId={tournament.id}
          groupingEnabled={tournament.grouping_enabled}
          players={players}
          groups={groups}
        />

        <FormBuilderSection
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          initialConfig={formConfig}
        />

        <AdminPlayerSection players={players} tournamentId={tournament.id} />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
        {value}
      </p>
    </div>
  );
}