import Link from "next/link";
import { headers } from "next/headers";
import { getSiteState } from "@/lib/queries/site";

/**
 * Reads the incoming Host header and returns true if the current
 * request is coming from a development environment.
 *
 * Dev hosts bypass the maintenance check entirely — so toggling
 * "Go Offline" in the admin panel only affects the DEPLOYED site,
 * never localhost.
 */
async function isDevHost(): Promise<boolean> {
  try {
    const headersList = await headers();
    const host = (headersList.get("host") ?? "").toLowerCase();
    if (!host) return false;

    return (
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.startsWith("[::1]") ||
      host.startsWith("::1") ||
      host.startsWith("0.0.0.0") ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Local development always sees the real site ──
  if (await isDevHost()) {
    return <>{children}</>;
  }

  // ── Production: respect the admin's site_state toggle ──
  const state = await getSiteState();
  if (state !== "maintenance") return <>{children}</>;

  return (
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050A08] px-6 text-center text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(45,106,79,0.28), transparent 55%), radial-gradient(circle at 80% 75%, rgba(255,232,184,0.08), transparent 55%)",
        }}
      />

      <div className="mx-auto max-w-md">
        <p className="text-5xl" aria-hidden>
          🏏
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-cream sm:text-4xl">
          CRICZONE
        </h1>
        <p className="mt-3 text-lg font-semibold text-cream/80">
          We&rsquo;ll be right back.
        </p>
        <p className="mt-2 text-sm text-cream/55">
          The site is under maintenance. Please check back shortly.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-mint/30 bg-mint/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-mint transition hover:bg-mint/20"
          >
            Retry
          </Link>
          <a
            href="tel:+917709551877"
            className="rounded-xl border border-cream/20 bg-cream/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cream/80 transition hover:border-mint/50 hover:text-cream"
          >
            📞 Arfat Momin
          </a>
        </div>
      </div>
    </main>
  );
}