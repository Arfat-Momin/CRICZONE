"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * CRICZONE — Simple Centered Hero
 *
 * Performance notes:
 *  - No `useScroll` — background is static (no rAF loop)
 *  - No `filter: blur()` in overlays (pre-softened radial gradients)
 *  - No `mix-blend-*` layers
 *  - Animations run ONCE on mount (load / hard refresh), then idle
 */

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.25,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: -14, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#050A08] text-cream">
      {/* Fallback gradient (visible if image fails) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_top,#0F231A_0%,#050A08_70%)]"
      />

      {/* Background image — fades in + subtle zoom on load */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-30"
        variants={reduce ? undefined : imageVariants}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "visible"}
      >
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* Readability overlays — pre-softened gradients, no blur filters */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-[#050A08]/70 via-[#050A08]/60 to-[#050A08]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-[60%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,232,184,0.18), rgba(255,232,184,0.06) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-40 bg-gradient-to-t from-[#050A08] to-transparent"
      />

      {/* ============================================================
          CENTERED CONTENT
          ============================================================ */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-4xl px-6 py-24 text-center md:py-32"
        variants={reduce ? undefined : containerVariants}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "visible"}
      >
        {/* Badge */}
        <motion.div
          variants={reduce ? undefined : badgeVariants}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint">
            <span className="cz-pulse-dot inline-block h-2 w-2 rounded-full bg-sold" />
            Live Turf Cricket Auctions
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={reduce ? undefined : itemVariants}
          className="mt-7 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-cream text-glow-mint sm:text-6xl lg:text-7xl"
        >
          Where turf cricket
          <br />
          auctions{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-mint text-glow-warm">
              come alive.
            </span>
          </span>
        </motion.h1>

        {/* Short subhead */}
        <motion.p
          variants={reduce ? undefined : itemVariants}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream/75 md:text-lg"
        >
          Run, watch, and celebrate live auctions — from one link.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={reduce ? undefined : itemVariants}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
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
          variants={reduce ? undefined : itemVariants}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-cream/50"
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