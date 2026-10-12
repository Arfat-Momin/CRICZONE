import Link from "next/link";

export const metadata = {
  title: "Page not found · CRICZONE",
};

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#050A08] px-6 text-center text-cream">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(45,106,79,0.28), transparent 55%), radial-gradient(circle at 80% 75%, rgba(255,232,184,0.08), transparent 55%)",
        }}
      />

      <p className="font-[family-name:var(--font-numeric)] text-7xl font-bold leading-none text-mint sm:text-8xl md:text-9xl">
        404
      </p>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-cream sm:text-3xl md:text-4xl">
        This page doesn&rsquo;t exist
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm text-cream/60 sm:text-base">
        The link may be broken, or the page may have moved. Head back home or
        browse the archive.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-mint px-6 py-3 text-xs font-bold uppercase tracking-widest text-forest shadow-[0_12px_40px_-12px_rgba(216,243,220,0.7)] transition hover:-translate-y-0.5 hover:bg-cream sm:px-7 sm:text-sm"
        >
          Back to home
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 rounded-xl border border-cream/25 bg-cream/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-cream transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 sm:px-7 sm:text-sm"
        >
          View archive
        </Link>
      </div>

      <p className="mt-12 text-[10px] font-extrabold uppercase tracking-[0.32em] text-cream/30">
        CRICZONE
      </p>
    </main>
  );
}