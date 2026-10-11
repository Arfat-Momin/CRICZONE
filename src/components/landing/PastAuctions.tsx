import Link from "next/link";
import { format } from "date-fns";
import { Reveal } from "@/components/shared/Reveal";
import { getArchivedTournaments } from "@/lib/queries/tournaments";

export async function PastAuctions() {
  const archives = await getArchivedTournaments(6);

  return (
    <section className="relative bg-[#0A1410] py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(45,106,79,0.3),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-mint">
                Hall of Fame
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-cream md:text-4xl">
                Past Auctions
              </h2>
            </div>
            <Link
              href="/archive"
              className="text-sm font-bold text-mint underline-offset-4 hover:underline"
            >
              View all archives →
            </Link>
          </div>
        </Reveal>

        {archives.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-mint/20 bg-cream/5 p-10 text-center text-sm text-cream/60 backdrop-blur">
              No archived auctions yet. Once a tournament ends and is archived, it
              will appear here.
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archives.map((t, i) => (
              <Reveal key={t.id} delay={i * 60}>
                <Link
                  href={`/archive/${t.slug}`}
                  className="group block rounded-xl border border-mint/12 glass-dark p-5 transition hover:-translate-y-0.5 hover:border-mint/35"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-mint/70">
                    {t.auction_start_at
                      ? format(new Date(t.auction_start_at), "MMM yyyy")
                      : "Archived"}
                  </p>
                  <h3 className="mt-1 line-clamp-1 font-[family-name:var(--font-display)] text-lg font-bold text-cream">
                    {t.name}
                  </h3>
                  {t.venue && (
                    <p className="mt-1 line-clamp-1 text-xs text-cream/55">
                      {t.venue}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}