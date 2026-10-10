import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TournamentHero } from "@/components/tournament/TournamentHero";
import { RosterGrid } from "@/components/tournament/RosterGrid";
import { TeamGrid } from "@/components/tournament/TeamGrid";
import { RosterRealtimeBridge } from "@/components/tournament/RosterRealtimeBridge";
import { AuctionRoom } from "@/components/tournament/auction/AuctionRoom";
import { SummaryView } from "@/components/tournament/SummaryView";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

/**
 * ISR: page is statically cached and regenerated in the background.
 * - Live auctions get fresh data via client-side realtime (no polling needed)
 * - Status transitions (ended, registration closed) propagate within 30s
 */
export const revalidate = 30;

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

export async function generateStaticParams() {
  // Don't pre-render at build; regenerate on demand (ISR).
  return [];
}

export default async function TournamentPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) notFound();

  const { tournament, players, teams, state } = data;
  const config = normalizeFormConfig(tournament.form_config, tournament.name);

  const displayFields = config.cardDisplayFields
    .map((id) => {
      const field = config.formFields.find((f) => f.id === id);
      if (field) return { id, label: field.label };
      if (id === "basePrice") return { id, label: "Base Price" };
      return null;
    })
    .filter((x): x is { id: string; label: string } => x !== null);

  if (tournament.status === "live") {
    return (
      <MaintenanceGate>
        <AuctionRoom
          tournament={tournament}
          initialPlayers={players}
          initialTeams={teams}
          initialState={state}
        />
      </MaintenanceGate>
    );
  }

  if (tournament.status === "ended" || tournament.status === "archived") {
    return (
      <MaintenanceGate>
        <Navbar />
        <main>
          <SummaryView tournament={tournament} players={players} teams={teams} />
        </main>
        <Footer />
      </MaintenanceGate>
    );
  }

  const registrationOpen =
    tournament.registration_enabled &&
    config.enabled &&
    (tournament.status === "registration" || tournament.status === "ready");

  return (
    <MaintenanceGate>
      <Navbar />
      <RosterRealtimeBridge tournamentId={tournament.id} />

      <main>
        <TournamentHero tournament={tournament} />

        {registrationOpen && (
          <section className="mx-auto max-w-7xl px-6 pt-8">
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#2D6A4F]/25 bg-gradient-to-r from-mint/60 to-cream p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F]">
                  Want to play?
                </p>
                <p className="mt-0.5 text-sm text-[#1B4332]/75">
                  Registration is open for this tournament.
                </p>
              </div>
              <Link
                href={`/t/${tournament.slug}/register`}
                className="rounded-xl bg-forest px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-cream shadow-md transition hover:-translate-y-0.5 hover:bg-[#2D6A4F]"
              >
                Register as a player &rarr;
              </Link>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <TeamGrid teams={teams} />

          <section className={teams.length > 0 ? "mt-14" : ""}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest md:text-3xl">
              Players
            </h2>
            <p className="mt-1 text-sm text-[#1B4332]/65">
              {players.length} registered
            </p>
            <div className="mt-6">
              <RosterGrid players={players} displayFields={displayFields} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </MaintenanceGate>
  );
}