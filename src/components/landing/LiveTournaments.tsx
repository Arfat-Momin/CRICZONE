import { Reveal } from "@/components/shared/Reveal";
import { TournamentCard } from "./TournamentCard";
import { getActiveTournaments } from "@/lib/queries/tournaments";

export async function LiveTournaments() {
  const tournaments = await getActiveTournaments();

  return (
    <section
      id="tournaments"
      className="relative scroll-mt-20 bg-[#0A1410] py-20 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(27,67,50,0.45),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-mint">
                Live &amp; Upcoming
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-cream md:text-4xl">
                Active Tournaments
              </h2>
            </div>
            <p className="max-w-md text-sm text-cream/60">
              Jump into a live auction, register for an upcoming league, or just
              watch the action unfold.
            </p>
          </div>
        </Reveal>

        {tournaments.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-mint/20 bg-cream/5 p-12 text-center backdrop-blur">
              <p className="text-lg font-semibold text-cream/80">
                No active tournaments right now.
              </p>
              <p className="mt-2 text-sm text-cream/50">
                Check back soon — new leagues are announced regularly.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 60}>
                <TournamentCard tournament={t} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}