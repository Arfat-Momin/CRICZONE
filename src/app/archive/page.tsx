import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/shared/Reveal";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { getArchivedTournaments } from "@/lib/queries/tournaments";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse completed CRICZONE auctions and their final squads.",
};

export const revalidate = 60;

export default async function ArchivePage() {
  const archives = await getArchivedTournaments(48);

  return (
    <MaintenanceGate>
      <div className="min-h-screen w-full bg-[#0A1410] text-cream">
        <Navbar />

        <main className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60%]"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(45,106,79,0.35), transparent 70%)",
            }}
          />

          <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20">
            <Reveal>
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
                  Archive
                </span>
                <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-cream text-glow-mint sm:text-4xl md:text-5xl lg:text-6xl">
                  Every auction we&rsquo;ve run
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/60 sm:text-base">
                  A permanent record of each completed tournament — final
                  squads, prices, and rankings.
                </p>
              </div>
            </Reveal>

            {archives.length === 0 ? (
              <Reveal>
                <div className="mx-auto mt-14 max-w-xl rounded-2xl border border-dashed border-mint/20 bg-[#050A08]/60 p-10 text-center backdrop-blur-sm sm:mt-20 sm:p-12">
                  <p className="text-4xl" aria-hidden>
                    🏏
                  </p>
                  <p className="mt-4 text-base font-semibold text-cream/80">
                    No completed tournaments yet
                  </p>
                  <p className="mt-2 text-sm text-cream/50">
                    Once an auction ends, it will appear here.
                  </p>
                </div>
              </Reveal>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {archives.map((t, i) => {
                  const isEnded = t.status === "ended";
                  const badgeLabel = isEnded ? "Ended" : "Archived";
                  return (
                    <Reveal key={t.id} delay={i * 50}>
                      <Link
                        href={`/archive/${t.slug}`}
                        className="group block h-full overflow-hidden rounded-2xl border border-mint/12 bg-[#050A08]/60 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-mint/40 hover:bg-[#050A08]/80 hover:shadow-[0_20px_60px_-20px_rgba(216,243,220,0.3)] sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                              isEnded
                                ? "border-[#FFA000]/35 bg-[#FFA000]/10 text-[#FFA000]"
                                : "border-mint/20 bg-mint/5 text-mint/80"
                            }`}
                          >
                            {badgeLabel}
                          </span>
                          <span
                            aria-hidden
                            className="text-mint/40 transition group-hover:translate-x-0.5 group-hover:text-mint"
                          >
                            →
                          </span>
                        </div>

                        <h2 className="mt-4 line-clamp-2 font-[family-name:var(--font-display)] text-lg font-bold leading-snug text-cream sm:text-xl">
                          {t.name}
                        </h2>

                        <div className="mt-3 space-y-1 text-xs text-cream/55 sm:text-sm">
                          {t.auction_start_at && (
                            <p>
                              📅{" "}
                              {format(
                                new Date(t.auction_start_at),
                                "MMM d, yyyy",
                              )}
                            </p>
                          )}
                          {t.venue && (
                            <p className="line-clamp-1">📍 {t.venue}</p>
                          )}
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </MaintenanceGate>
  );
}