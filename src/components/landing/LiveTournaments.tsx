import { Reveal } from "@/components/shared/Reveal";
import { TournamentCard } from "./TournamentCard";
import { getActiveTournaments } from "@/lib/queries/tournaments";

export async function LiveTournaments() {
  const tournaments = await getActiveTournaments();

  return (
    <section id="tournaments" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20 md:py-28">
      <Reveal>
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F]">
              Live &amp; Upcoming
            </span>
            <h2 className="mt-2 text-3xl font-bold text-forest md:text-4xl">
              Active Tournaments
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#1B4332]/65">
            Jump into a live auction, register for an upcoming league, or just watch the
            action unfold.
          </p>
        </div>
      </Reveal>

      {tournaments.length === 0 ? (
        <Reveal>
          <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-12 text-center">
            <p className="text-lg font-semibold text-[#1B4332]/70">
              No active tournaments right now.
            </p>
            <p className="mt-2 text-sm text-[#1B4332]/50">
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
    </section>
  );
}