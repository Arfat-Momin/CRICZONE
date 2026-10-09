import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How CRICZONE runs real-time turf cricket auctions — from tournament setup to the final bid.",
};

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
    <>
      <Navbar />
      <main className="pt-8">
        <HowItWorks />

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <h2 className="text-3xl font-bold text-forest md:text-4xl">
            Frequently asked
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-[#1B4332]/10 bg-white p-5 transition hover:border-[#2D6A4F]/40"
              >
                <summary className="cursor-pointer list-none text-base font-bold text-forest marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-[#2D6A4F] transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#1B4332]/70">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}