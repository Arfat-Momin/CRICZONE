import { requireAdmin } from "@/lib/auth/requireAdmin";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata = {
  title: "Dashboard · CRICZONE Admin",
};

export default async function DashboardPage() {
  const { user } = await requireAdmin();

  return (
    <main className="min-h-screen w-full bg-[#FDFCF0] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1B4332]">
              CRICZONE Admin
            </h1>
            <p className="mt-1 text-sm text-[#2D6A4F]/70">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-10 rounded-2xl border border-[#1B4332]/10 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#1B4332]">Dashboard coming soon</h2>
          <p className="mt-2 text-sm text-[#2D6A4F]/70">
            Tournament creation + management UI arrives in Phase 9.
          </p>
        </div>
      </div>
    </main>
  );
}