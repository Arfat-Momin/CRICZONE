import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NightBackdrop } from "@/components/shared/NightBackdrop";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import { RegistrationForm } from "@/components/tournament/RegistrationForm";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";
import { normalizeFormConfig } from "@/lib/tournament/form-config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) return { title: "Registration" };
  return { title: `Register · ${data.tournament.name}` };
}

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) notFound();

  const { tournament } = data;
  const config = normalizeFormConfig(tournament.form_config, tournament.name);
  const open =
    tournament.registration_enabled &&
    config.enabled &&
    (tournament.status === "registration" || tournament.status === "ready");

  return (
    <NightBackdrop>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-14 pb-12 sm:px-6 sm:pt-16 sm:pb-16">
        {/* Header with poster */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
          {tournament.poster_url && (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-mint/30 shadow-[0_0_40px_-10px_rgba(216,243,220,0.35)]">
              <ZoomableImage
                src={tournament.poster_url}
                alt={`${tournament.name} poster`}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 w-full">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint/80">
              {tournament.name}
            </span>
            <h1 className="mt-1 break-words font-[family-name:var(--font-display)] text-2xl font-bold text-cream sm:text-3xl">
              {config.title}
            </h1>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-cream/65 sm:text-left">
          {config.description}
        </p>

        <div className="mt-6 sm:mt-8">
          {open ? (
            <RegistrationForm
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              config={config}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-8 text-center sm:p-10">
              <p className="text-3xl" aria-hidden>
                🔒
              </p>
              <p className="mt-3 text-base font-semibold text-cream/85 sm:text-lg">
                Registration Closed
              </p>
              <p className="mt-1 text-sm text-cream/55">
                Registration is not open for this tournament right now.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </NightBackdrop>
  );
}