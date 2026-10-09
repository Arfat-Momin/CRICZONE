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
import { getTournamentPublicData } from "@/lib/queries/tournament-public";

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
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) notFound();

  const { tournament, players, teams, state } = data;

  // LIVE — immersive auction room
  if (tournament.status === "live") {
    return (
      <AuctionRoom
        tournament={tournament}
        initialPlayers={players}
        initialTeams={teams}
        initialState={state}
      />
    );
  }

  // ENDED / ARCHIVED — summary view (public, shareable)
  if (tournament.status === "ended" || tournament.status === "archived") {
    return (
      <>
        <Navbar />
        <main>
          <SummaryView tournament={tournament} players={players} teams={teams} />
        </main>
        <Footer />
      </>
    );
  }

  // PRE-AUCTION — countdown + roster + registration CTA
  const registrationOpen =
    tournament.registration_enabled &&
    (tournament.status === "registration" || tournament.status === "ready");

  return (
    <>
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
              <RosterGrid players={players} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}