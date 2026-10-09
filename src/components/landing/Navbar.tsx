import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1B4332]/10 bg-[#FDFCF0]/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-forest"
        >
          CRICZONE
        </Link>
        <ul className="flex items-center gap-6 text-sm font-semibold text-[#1B4332]/80">
          <li>
            <Link href="/how-it-works" className="transition hover:text-forest">
              How It Works
            </Link>
          </li>
          <li>
            <Link href="/archive" className="transition hover:text-forest">
              Archive
            </Link>
          </li>
          <li>
            <Link
              href="/admin"
              className="rounded-lg border border-[#1B4332]/20 px-3 py-1.5 transition hover:bg-mint hover:text-forest"
            >
              Admin
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}