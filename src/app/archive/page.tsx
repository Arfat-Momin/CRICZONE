import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/shared/Reveal";
import { getArchivedTournaments } from "@/lib/queries/tournaments";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse completed CRICZONE auctions and their final squads.",
};

export const revalidate = 120;

export default async function ArchivePage() {
  const archives = await getArchivedTournaments(48);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F]">
            Archive
          </span>
          <h1 className="mt-2 text-4xl font-bold text-forest md:text-5xl">
            Every auction we&apos;ve run
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#1B4332]/65">
            A permanent record of each completed tournament — final squads, prices, and
            rankings.
          </p>
        </Reveal>

        {archives.length === 0 ? (
          <Reveal>
            <div className="mt-14 rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-12 text-center text-[#1B4332]/60">
              No archived tournaments yet.
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archives.map((t, i) => (
              <Reveal key={t.id} delay={i * 40}>
                <Link
                  href={`/archive/${t.slug}`}
                  className="block rounded-xl border border-[#1B4332]/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F]/40 hover:shadow-md"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F]/70">
                    {t.auction_start_at
                      ? format(new Date(t.auction_start_at), "MMM d, yyyy")
                      : "Archived"}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-forest">
                    {t.name}
                  </h2>
                  {t.venue && (
                    <p className="mt-1 text-xs text-[#1B4332]/60">{t.venue}</p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}