import Link from "next/link";
import { HiddenAdminTrigger } from "@/components/shared/HiddenAdminTrigger";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-[#1B4332]/10 bg-[#1B4332] text-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            CRICZONE
          </h3>
          <p className="mt-2 max-w-xs text-sm text-cream/70">
            Real-time turf cricket tournament auctions. Built for organizers, loved by
            crowds.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-mint">
            Explore
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>
              <Link href="/" className="hover:text-mint">
                Home
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-mint">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/archive" className="hover:text-mint">
                Archive
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-mint">
            Contact
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>Organize a tournament?</li>
            <li>Reach out to the host directly.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/60">
        <HiddenAdminTrigger>
          &copy; {year} CRICZONE · Designed and Developed by Arfat Momin
        </HiddenAdminTrigger>
      </div>
    </footer>
  );
}