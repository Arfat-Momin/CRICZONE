"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * CRICZONE — Night Stadium Hero v2
 *
 * Performance notes:
 *  - No `useScroll` — the image is a static backdrop (kills a rAF loop)
 *  - No `filter: blur()` on lights — replaced with pre-softened gradients
 *  - No `mix-blend-*` — avoids extra compositing layers
 *  - No navbar backdrop-blur on this page (see Navbar.tsx)
 *  - All reveal animations run once (initial → animate), not on scroll
 */

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden bg-[#050A08] text-cream">
      {/* ============================================================
          LAYER 1 — FALLBACK GRADIENT (deepest)
          ============================================================ */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_top,#0F231A_0%,#050A08_70%)]"
      />

      {/* ============================================================
          LAYER 2 — HERO IMAGE (static, above fallback)
          ============================================================ */}
      <div aria-hidden className="absolute inset-0 -z-30">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* ============================================================
          LAYER 3 — STATIC OVERLAYS (readability, no blur filters)
          ============================================================ */}
      {/* Left-side darken so text is readable; right side stays bright to show the image */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-r from-[#050A08] via-[#050A08]/80 to-[#050A08]/30"
      />
      {/* Bottom fade into the next section */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-40 bg-gradient-to-t from-[#050A08] to-transparent"
      />
      {/* Soft floodlight bloom from top (pre-softened radial, no blur filter) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,232,184,0.18), rgba(255,232,184,0.06) 40%, transparent 70%)",
        }}
      />
      {/* Two diagonal light washes (soft edges — no blur filter needed) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-30"
        style={{
          background:
            "linear-gradient(118deg, transparent 20%, rgba(216,243,220,0.12) 38%, transparent 48%), linear-gradient(62deg, transparent 55%, rgba(216,243,220,0.1) 72%, transparent 82%)",
        }}
      />

      {/* ============================================================
          CONTENT — split: text left / preview card right
          ============================================================ */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ---------- LEFT: copy ---------- */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
            {/* Kicker */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint">
                <span className="cz-pulse-dot inline-block h-2 w-2 rounded-full bg-sold" />
                Live Turf Cricket Auctions
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="mt-7 font-[family-name:var(--font-display)] text-[2.75rem] font-bold leading-[0.98] tracking-[-0.02em] text-cream text-glow-mint sm:text-6xl lg:text-7xl"
            >
              Where turf cricket
              <br />
              auctions{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic text-mint text-glow-warm">
                  come alive.
                </span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 z-0 h-3 bg-mint/20 blur-[2px]"
                />
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={itemVariants}
              className="mt-7 max-w-xl text-base leading-relaxed text-cream/75 md:text-lg"
            >
              Run multiple tournaments in parallel. Host live bidding from any
              device. Give your crowd a broadcast-quality night — all from one
              link.
            </motion.p>

            {/* CTA row */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="#tournaments"
                className="group inline-flex items-center gap-2 rounded-xl bg-mint px-7 py-4 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_14px_50px_-12px_rgba(216,243,220,0.75)] transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
              >
                Browse live now
                <span
                  aria-hidden
                  className="transition group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-cream/25 bg-cream/5 px-7 py-4 text-sm font-bold uppercase tracking-wide text-cream transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
              >
                See how it works
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/50"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-mint" />
                Real-time bidding
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-mint" />
                Multi-tournament
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-mint" />
                Broadcast-ready
              </span>
            </motion.div>
          </motion.div>

          {/* ---------- RIGHT: live preview card ---------- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:col-span-5"
          >
            <HeroPreviewCard />
          </motion.div>
        </div>
      </div>

      {/* ============================================================
          SCROLL CUE
          ============================================================ */}
      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-cream/40 md:flex"
      >
        <span>Scroll</span>
        <span className="inline-block h-6 w-[1px] bg-gradient-to-b from-cream/60 to-transparent" />
      </div>
    </section>
  );
}

/* ============================================================
   HERO PREVIEW CARD — decorative mock of a live auction
   ============================================================ */

function HeroPreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:ml-auto">
      {/* Ambient glow behind the card */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(216,243,220,0.28),transparent_65%)] opacity-70"
      />

      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl border border-mint/20 bg-[#0A1410]/85 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-mint/10 px-5 py-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-sold px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white">
            <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
            Live now
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
            CRICZONE · S07
          </span>
        </div>

        {/* Player row */}
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-mint/40 bg-[#1B4332] text-lg font-bold text-mint">
            R
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-mint/70">
              On the Block
            </p>
            <p className="mt-1 truncate font-[family-name:var(--font-display)] text-xl font-bold text-cream">
              Rohit Sharma
            </p>
            <p className="mt-0.5 truncate text-[11px] text-cream/50">
              Batsman · #7 · Pune Strikers
            </p>
          </div>
        </div>

        {/* Bid row */}
        <div className="border-t border-mint/10 px-5 py-5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-cream/40">
            Current Bid
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-[family-name:var(--font-numeric)] text-5xl font-bold leading-none text-mint">
              2.5
            </p>
            <p className="text-xs font-extrabold uppercase tracking-widest text-mint/60">
              pts
            </p>
          </div>
          <p className="mt-2 text-xs text-cream/60">
            Bid by{" "}
            <span className="font-bold text-cream/90">Team Titans</span>
          </p>
        </div>

        {/* Footer row */}
        <div className="grid grid-cols-3 divide-x divide-mint/10 border-t border-mint/10">
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-cream/40">
              Teams
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-numeric)] text-base font-bold text-cream/90">
              12
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-cream/40">
              Players
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-numeric)] text-base font-bold text-cream/90">
              86
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-cream/40">
              Sold
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-numeric)] text-base font-bold text-mint">
              42
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}