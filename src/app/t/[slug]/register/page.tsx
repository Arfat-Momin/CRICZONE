import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
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
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <div className="flex items-center gap-4">
          {tournament.poster_url && (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#2D6A4F]/40 shadow-md">
              <ZoomableImage
                src={tournament.poster_url}
                alt={`${tournament.name} poster`}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]">
              {tournament.name}
            </span>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-forest md:text-3xl">
              {config.title}
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#1B4332]/65">{config.description}</p>

        <div className="mt-8">
          {open ? (
            <RegistrationForm
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              config={config}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-10 text-center">
              <p className="text-3xl" aria-hidden>
                🔒
              </p>
              <p className="mt-3 text-lg font-semibold text-[#1B4332]/75">
                Registration Closed
              </p>
              <p className="mt-1 text-sm text-[#1B4332]/55">
                Registration is not open for this tournament right now.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}