import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NightBackdrop } from "@/components/shared/NightBackdrop";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { TournamentHero } from "@/components/tournament/TournamentHero";
import { RosterGrid } from "@/components/tournament/RosterGrid";
import { TeamGrid } from "@/components/tournament/TeamGrid";
import { RosterRealtimeBridge } from "@/components/tournament/RosterRealtimeBridge";
import { TournamentStatusBridge } from "@/components/tournament/TournamentStatusBridge";
import { AuctionRoom } from "@/components/tournament/auction/AuctionRoom";
import { SummaryView } from "@/components/tournament/SummaryView";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";
import { normalizeFormConfig } from "@/lib/tournament/form-config";
import { buildDisplayFields } from "@/lib/tournament/player-field-value";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) return { title: "Tournament not found" };
  return {
    title: data.tournament.name,
    description: `Live turf cricket auction — ${data.tournament.name}`,
  };
}

export default async function TournamentPage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) notFound();

  const { tournament, players, teams, state } = data;
  const config = normalizeFormConfig(tournament.form_config, tournament.name);

  const displayFields = buildDisplayFields(
    config.cardDisplayFields,
    config.formFields,
  );
  const blockDisplayFields = buildDisplayFields(
    config.auctionBlockDisplayFields,
    config.formFields,
  );

  // ============ LIVE — immersive auction room ============
  if (tournament.status === "live") {
    return (
      <MaintenanceGate>
        <TournamentStatusBridge tournamentId={tournament.id} />
        <AuctionRoom
          tournament={tournament}
          initialPlayers={players}
          initialTeams={teams}
          initialState={state}
          blockDisplayFields={blockDisplayFields}
        />
      </MaintenanceGate>
    );
  }

  // ============ ENDED / ARCHIVED — summary ============
  if (tournament.status === "ended" || tournament.status === "archived") {
    return (
      <MaintenanceGate>
        <TournamentStatusBridge tournamentId={tournament.id} />
        <NightBackdrop>
          <Navbar />
          <main className="pt-14 sm:pt-16">
            <SummaryView tournament={tournament} players={players} teams={teams} />
          </main>
          <Footer />
        </NightBackdrop>
      </MaintenanceGate>
    );
  }

  // ============ PRE-AUCTION — countdown + roster + register CTA ============
  const registrationOpen =
    tournament.registration_enabled &&
    config.enabled &&
    (tournament.status === "registration" || tournament.status === "ready");

  return (
    <MaintenanceGate>
      <TournamentStatusBridge tournamentId={tournament.id} />
      <NightBackdrop>
        <Navbar />
        <RosterRealtimeBridge tournamentId={tournament.id} />

        <main className="pt-14 sm:pt-16">
          <TournamentHero tournament={tournament} />

          {registrationOpen && (
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-mint/20 bg-gradient-to-r from-mint/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-mint">
                    Want to play?
                  </p>
                  <p className="mt-0.5 text-sm text-cream/70">
                    Registration is open for this tournament.
                  </p>
                </div>
                <Link
                  href={`/t/${tournament.slug}/register`}
                  className="w-full rounded-xl bg-mint px-5 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-forest shadow-[0_10px_35px_-10px_rgba(216,243,220,0.6)] transition hover:-translate-y-0.5 hover:bg-cream sm:w-auto"
                >
                  Register as a player &rarr;
                </Link>
              </div>
            </section>
          )}

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-12">
            <TeamGrid teams={teams} />

            <section className={teams.length > 0 ? "mt-10 sm:mt-14" : ""}>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-cream sm:text-2xl md:text-3xl">
                Players
              </h2>
              <p className="mt-1 text-xs text-cream/55 sm:text-sm">
                {players.length} registered
              </p>
              <div className="mt-4 sm:mt-6">
                <RosterGrid players={players} displayFields={displayFields} />
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </NightBackdrop>
    </MaintenanceGate>
  );
}