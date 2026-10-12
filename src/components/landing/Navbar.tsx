"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-first responsive navbar.
 *
 * Below `md` (768px): only logo + compact "Live" CTA visible.
 *   "How It Works" and "Archive" are hidden on small screens to
 *   prevent overlap. They remain reachable via the footer.
 *
 * The header is `fixed`, so pages that don't start with a full-
 * height hero must add `pt-14 sm:pt-16` to their content wrapper.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        raf = 0;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-mint/10 bg-[#050A08]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-cream sm:text-xl"
        >
          CRICZONE
        </Link>

        {/* Right side */}
        <ul className="flex items-center gap-1 text-sm font-semibold text-cream/85">
          <li className="hidden md:block">
            <Link
              href="/how-it-works"
              className="rounded-lg px-3 py-2 transition-colors hover:bg-mint/10 hover:text-mint"
            >
              How It Works
            </Link>
          </li>
          <li className="hidden md:block">
            <Link
              href="/archive"
              className="rounded-lg px-3 py-2 transition-colors hover:bg-mint/10 hover:text-mint"
            >
              Archive
            </Link>
          </li>
          <li>
            <Link
              href="#tournaments"
              className="inline-flex items-center justify-center rounded-lg bg-mint px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-forest transition-colors hover:bg-cream sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Live Now</span>
              <span className="sm:hidden">Live</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}