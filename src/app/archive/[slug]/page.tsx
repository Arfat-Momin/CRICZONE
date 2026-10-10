import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SummaryView } from "@/components/tournament/SummaryView";
import { MaintenanceGate } from "@/components/shared/MaintenanceGate";
import { getTournamentPublicData } from "@/lib/queries/tournament-public";

export const revalidate = 300; // Archived data changes rarely

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
      <Navbar />
      <main>
        <div className="mx-auto max-w-7xl px-6 pt-8">
          <Link
            href="/archive"
            className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] hover:underline"
          >
            &larr; Back to Archive
          </Link>
        </div>
        <SummaryView tournament={tournament} players={players} teams={teams} />
      </main>
      <Footer />
    </MaintenanceGate>
  );
}