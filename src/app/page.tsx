import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { ScoreboardTicker } from "@/components/landing/ScoreboardTicker";
import { LiveTournaments } from "@/components/landing/LiveTournaments";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PastAuctions } from "@/components/landing/PastAuctions";
import { Footer } from "@/components/landing/Footer";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";

export const revalidate = 30;

export default function HomePage() {
  return (
    <MaintenanceGate>
      <div className="min-h-screen bg-[#0A1410]">
        <Navbar />
        <main>
          <Hero />
          <StatsBar />
          <ScoreboardTicker />
          <LiveTournaments />
          <HowItWorks />
          <PastAuctions />
        </main>
        <Footer />
      </div>
    </MaintenanceGate>
  );
}