"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Performance note: no `backdrop-blur` here.
 * Backdrop-filter on a sticky header forces the browser to composite
 * everything below it on every scroll frame. A solid dark bar after
 * scroll feels faster and looks just as clean on the night theme.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      // Throttle with rAF — avoids running on every scroll event
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
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-cream text-glow-mint"
        >
          CRICZONE
        </Link>
        <ul className="flex items-center gap-1 text-sm font-semibold text-cream/85">
          <li>
            <Link
              href="/how-it-works"
              className="rounded-lg px-3 py-2 transition-colors hover:bg-mint/10 hover:text-mint"
            >
              How It Works
            </Link>
          </li>
          <li>
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
              className="ml-2 rounded-lg bg-mint px-3.5 py-2 text-forest transition-colors hover:bg-cream"
            >
              Live Now
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}