import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How CRICZONE runs real-time turf cricket auctions — from tournament setup to the final bid.",
};

export const revalidate = 3600;

const FAQ = [
  {
    q: "Can two tournaments run at the same time?",
    a: "Yes. Every tournament is fully isolated with its own players, teams, groups, and realtime channel. Running multiple leagues in parallel is a first-class feature.",
  },
  {
    q: "How does live bidding work?",
    a: "The organizer puts a player on the block. Captains (or a single auctioneer) tap team buttons to raise the bid. Every viewer sees the price update in under a second.",
  },
  {
    q: "What happens to unsold players?",
    a: "They stay in the Unsold list. The organizer can re-auction any unsold player at any time.",
  },
  {
    q: "Is registration secure?",
    a: "Every mobile number can register only once per tournament. Photos are stored in Supabase Storage and never embedded as base64 in the database.",
  },
];

export default function HowItWorksPage() {
  return (
    <MaintenanceGate>
      <div className="min-h-screen w-full bg-[#0A1410] text-cream">
        <Navbar />

        <main className="relative isolate overflow-hidden pt-16 sm:pt-20">
          {/* Ambient hero glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[55%]"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(45,106,79,0.35), transparent 70%)",
            }}
          />

          {/* Page header */}
          <section className="mx-auto max-w-7xl px-4 pt-14 pb-6 sm:px-6 sm:pt-16 sm:pb-10 md:pt-20 md:pb-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
                How It Works
              </span>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-cream text-glow-mint sm:text-4xl md:text-5xl lg:text-6xl">
                From kickoff to the final bid
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/60 sm:text-base">
                Four clean stages. Real-time for every viewer. One link for the
                whole tournament.
              </p>
            </div>
          </section>

          {/* Reuse the HowItWorks component (already dark) */}
          <HowItWorks />

          {/* FAQ */}
          <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
            <div className="text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint">
                FAQ
              </span>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-cream text-glow-mint sm:text-3xl md:text-4xl">
                Frequently asked
              </h2>
            </div>

            <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-4">
              {FAQ.map((item, i) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-2xl border border-mint/12 bg-[#050A08]/60 backdrop-blur-sm transition hover:border-mint/30"
                  style={{ transitionDelay: `${i * 20}ms` }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 sm:py-5">
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold text-cream sm:text-base md:text-lg">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-mint/25 bg-mint/5 text-mint transition-transform duration-300 group-open:rotate-45 sm:h-8 sm:w-8"
                    >
                      +
                    </span>
                  </summary>
                  <div className="border-t border-mint/10 px-4 py-4 sm:px-6 sm:py-5">
                    <p className="text-sm leading-relaxed text-cream/70 sm:text-[15px]">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 sm:pb-24">
            <div className="rounded-3xl border border-mint/20 bg-gradient-to-br from-[#0F231A]/80 to-[#050A08]/80 p-8 text-center shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] sm:p-10 md:p-12">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-cream text-glow-mint sm:text-3xl md:text-4xl">
                Ready to run your tournament?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-cream/60 sm:text-base">
                Create a league, open registration, and go live in minutes.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3 text-xs font-bold uppercase tracking-wide text-forest transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08] sm:px-6 sm:text-sm"
                >
                  Browse tournaments
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/archive"
                  className="inline-flex items-center gap-2 rounded-xl border border-cream/25 bg-cream/5 px-5 py-3 text-xs font-bold uppercase tracking-wide text-cream transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 sm:px-6 sm:text-sm"
                >
                  View archive
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </MaintenanceGate>
  );
}