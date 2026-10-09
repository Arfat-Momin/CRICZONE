import Link from "next/link";
import { format } from "date-fns";
import { Reveal } from "@/components/shared/Reveal";
import { getArchivedTournaments } from "@/lib/queries/tournaments";

export async function PastAuctions() {
  const archives = await getArchivedTournaments(6);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <Reveal>
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F]">
              Hall of Fame
            </span>
            <h2 className="mt-2 text-3xl font-bold text-forest md:text-4xl">
              Past Auctions
            </h2>
          </div>
          <Link
            href="/archive"
            className="text-sm font-bold text-[#2D6A4F] underline-offset-4 hover:underline"
          >
            View all archives &rarr;
          </Link>
        </div>
      </Reveal>

      {archives.length === 0 ? (
        <Reveal>
          <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-10 text-center text-sm text-[#1B4332]/60">
            No archived auctions yet. Once a tournament ends and is archived, it will
            appear here.
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archives.map((t, i) => (
            <Reveal key={t.id} delay={i * 60}>
              <Link
                href={`/archive/${t.slug}`}
                className="block rounded-xl border border-[#1B4332]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F]/40 hover:shadow-md"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F]/70">
                  {t.auction_start_at
                    ? format(new Date(t.auction_start_at), "MMM yyyy")
                    : "Archived"}
                </p>
                <h3 className="mt-1 line-clamp-1 font-[family-name:var(--font-display)] text-lg font-bold text-forest">
                  {t.name}
                </h3>
                {t.venue && (
                  <p className="mt-1 line-clamp-1 text-xs text-[#1B4332]/60">
                    {t.venue}
                  </p>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}