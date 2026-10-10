import Link from "next/link";
import { getSiteState } from "@/lib/queries/site";

export async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await getSiteState();
  if (state !== "maintenance") return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FDFCF0] px-6 text-center">
      <div className="max-w-md">
        <p className="text-5xl" aria-hidden>
          🏏
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-forest">
          CRICZONE
        </h1>
        <p className="mt-3 text-lg font-semibold text-[#1B4332]/80">
          We&apos;ll be right back.
        </p>
        <p className="mt-2 text-sm text-[#1B4332]/60">
          The site is under maintenance. Please check back shortly.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-forest transition hover:bg-mint"
        >
          Retry
        </Link>
      </div>
    </main>
  );
}