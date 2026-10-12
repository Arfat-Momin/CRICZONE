import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NightBackdrop } from "@/components/shared/NightBackdrop";

export default function TournamentNotFound() {
  return (
    <NightBackdrop>
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="font-[family-name:var(--font-numeric)] text-6xl font-bold leading-none text-mint sm:text-7xl">
          404
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-cream sm:text-3xl">
          Tournament not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-cream/60 sm:text-base">
          This tournament doesn&rsquo;t exist, isn&rsquo;t public yet, or the
          link has expired.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-mint px-6 py-3 text-xs font-bold uppercase tracking-widest text-forest shadow-[0_12px_40px_-12px_rgba(216,243,220,0.7)] transition hover:-translate-y-0.5 hover:bg-cream sm:text-sm"
          >
            Back to home
          </Link>
          <Link
            href="/archive"
            className="rounded-xl border border-cream/25 bg-cream/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-cream transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 sm:text-sm"
          >
            View archive
          </Link>
        </div>
      </main>
      <Footer />
    </NightBackdrop>
  );
}