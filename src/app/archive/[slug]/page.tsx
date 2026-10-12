import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NightBackdrop } from "@/components/shared/NightBackdrop";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { SummaryView } from "@/components/tournament/SummaryView";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) return { title: "Archive" };
  return {
    title: `${data.tournament.name} · Archive`,
    description: `Final results for ${data.tournament.name}`,
  };
}

export default async function ArchiveDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTournamentPublicData(slug);
  if (!data) notFound();

  const { tournament, players, teams } = data;

  if (tournament.status !== "archived" && tournament.status !== "ended") {
    notFound();
  }

  return (
    <MaintenanceGate>
      <NightBackdrop>
        <Navbar />
        <main className="pt-16 sm:pt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-mint/80 transition hover:gap-2 hover:text-mint"
            >
              <span aria-hidden>←</span> Back to Archive
            </Link>
          </div>
          <SummaryView
            tournament={tournament}
            players={players}
            teams={teams}
          />
        </main>
        <Footer />
      </NightBackdrop>
    </MaintenanceGate>
  );
}