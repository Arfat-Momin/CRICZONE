import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { ScoreboardTicker } from "@/components/landing/ScoreboardTicker";
import { LiveTournaments } from "@/components/landing/LiveTournaments";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PastAuctions } from "@/components/landing/PastAuctions";
import { Footer } from "@/components/landing/Footer";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 60;

function TournamentsSkeleton() {
  return (
    <section className="bg-[#0A1410] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-8 w-56 bg-cream/10" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-2xl bg-cream/5"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <MaintenanceGate>
      <div className="min-h-screen bg-[#0A1410]">
        <Navbar />
        <main>
          <Hero />
          <StatsBar />
          <ScoreboardTicker />
          <Suspense fallback={<TournamentsSkeleton />}>
            <LiveTournaments />
          </Suspense>
          <HowItWorks />
          <Suspense
            fallback={
              <section className="bg-[#0A1410] px-6 py-20">
                <div className="mx-auto max-w-7xl">
                  <Skeleton className="h-8 w-56 bg-cream/10" />
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-24 w-full rounded-xl bg-cream/5"
                      />
                    ))}
                  </div>
                </div>
              </section>
            }
          >
            <PastAuctions />
          </Suspense>
        </main>
        <Footer />
      </div>
    </MaintenanceGate>
  );
}