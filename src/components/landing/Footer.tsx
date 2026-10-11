import Link from "next/link";
import { HiddenAdminTrigger } from "@/components/shared/HiddenAdminTrigger";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-mint/10 bg-[#050A08] text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(216,243,220,0.08),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-glow-mint">
            CRICZONE
          </h3>
          <p className="mt-2 max-w-xs text-sm text-cream/60">
            Real-time turf cricket tournament auctions. Built for organizers,
            loved by crowds.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint">
            Explore
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>
              <Link href="/" className="transition hover:text-mint">
                Home
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="transition hover:text-mint">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/archive" className="transition hover:text-mint">
                Archive
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint">
            Contact
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>Organize a tournament?</li>
            <li>Reach out to the host directly.</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-mint/10 py-5 text-center text-xs text-cream/45">
        <HiddenAdminTrigger>
          &copy; {year} CRICZONE · Designed and Developed by Arfat Momin
        </HiddenAdminTrigger>
      </div>
    </footer>
  );
}