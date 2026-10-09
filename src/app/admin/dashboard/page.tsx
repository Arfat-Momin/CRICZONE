import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import { TournamentCard } from "@/components/admin/TournamentCard";
import { listAdminTournaments } from "@/lib/queries/admin";

export const metadata = { title: "Dashboard · CRICZONE Admin" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user } = await requireAdmin();
  const tournaments = await listAdminTournaments();

  return (
    <main className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="border-b border-[#1B4332]/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold text-forest"
          >
            CRICZONE
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-semibold text-[#1B4332]/60 sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-forest">
            Your Tournaments
          </h1>
          <p className="mt-1 text-sm text-[#1B4332]/65">
            Manage players, teams, and live auctions from here.
          </p>

          {tournaments.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-10 text-center">
              <p className="text-3xl" aria-hidden>
                🏏
              </p>
              <p className="mt-3 text-base font-semibold text-[#1B4332]/75">
                No tournaments yet
              </p>
              <p className="mt-1 text-sm text-[#1B4332]/55">
                Create one using the form on the right &rarr;
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tournaments.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <CreateTournamentForm />
        </aside>
      </div>
    </main>
  );
}