import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TournamentHero } from "@/components/tournament/TournamentHero";
import { RegistrationForm } from "@/components/tournament/RegistrationForm";
import { RosterGrid } from "@/components/tournament/RosterGrid";
import { TeamGrid } from "@/components/tournament/TeamGrid";
import { RosterRealtimeBridge } from "@/components/tournament/RosterRealtimeBridge";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

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

  const { tournament, players, teams } = data;
  const config = normalizeFormConfig(tournament.form_config, tournament.name);

  const registrationOpen =
    tournament.registration_enabled &&
    config.enabled &&
    (tournament.status === "registration" || tournament.status === "ready");

  return (
    <>
      <Navbar />
      <RosterRealtimeBridge tournamentId={tournament.id} />

      <main>
        <TournamentHero tournament={tournament} />

        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          {registrationOpen && (
            <section id="register" className="mb-14 scroll-mt-20">
              <div className="mx-auto max-w-2xl">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest md:text-3xl">
                  {config.title}
                </h2>
                <p className="mt-1.5 text-sm text-[#1B4332]/65">
                  {config.description}
                </p>
                <div className="mt-6">
                  <RegistrationForm
                    tournamentId={tournament.id}
                    tournamentName={tournament.name}
                    config={config}
                  />
                </div>
              </div>
            </section>
          )}

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