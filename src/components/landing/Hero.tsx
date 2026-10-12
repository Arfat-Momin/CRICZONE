"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * CRICZONE — Simple Centered Hero
 *
 * Performance: no useScroll, no filters, no backdrop-blur.
 * Glow text effects removed per Phase 53.
 */

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.13, delayChildren: 0.25 },
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

const TRUST_ITEMS = [
  "Real-time bidding",
  "Multi-tournament",
  "Broadcast-ready",
] as const;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#050A08] text-cream">
      {/* Fallback */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_top,#0F231A_0%,#050A08_70%)]"
      />

      {/* Hero image */}
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

      {/* Overlays */}
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

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24 md:py-28"
        variants={reduce ? undefined : containerVariants}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "visible"}
      >
        {/* Badge */}
        <motion.div variants={reduce ? undefined : badgeVariants}>
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.24em] text-mint sm:px-4 sm:text-[10px] sm:tracking-[0.3em]">
            <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-sold sm:h-2 sm:w-2" />
            Live Turf Cricket Auctions
          </span>
        </motion.div>

        {/* Headline — no glow, no underline blur */}
        <motion.h1
          variants={reduce ? undefined : itemVariants}
          className="mt-6 font-[family-name:var(--font-display)] text-[2.1rem] font-bold leading-[1.05] tracking-[-0.02em] text-cream sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Where turf cricket
          <br />
          auctions{" "}
          <span className="italic text-mint">come alive.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={reduce ? undefined : itemVariants}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/75 sm:mt-6 sm:text-base md:text-lg"
        >
          Run, watch, and celebrate live auctions — from one link.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={reduce ? undefined : itemVariants}
          className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center"
        >
          <Link
            href="#tournaments"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_14px_50px_-12px_rgba(216,243,220,0.75)] transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08] sm:px-7 sm:py-4"
          >
            Browse live now
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cream/25 bg-cream/5 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-cream transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08] sm:px-7 sm:py-4"
          >
            See how it works
          </Link>
        </motion.div>

        {/* Trust strip — mobile-tuned, wraps cleanly */}
        <motion.ul
          variants={reduce ? undefined : itemVariants}
          className="mt-8 flex w-full max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-cream/55 sm:mt-12 sm:max-w-none sm:gap-x-6 sm:text-[10px] sm:tracking-[0.24em] md:text-xs"
        >
          {TRUST_ITEMS.map((label) => (
            <li key={label} className="inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
              <span className="h-1 w-1 shrink-0 rounded-full bg-mint sm:h-1.5 sm:w-1.5" />
              <span>{label}</span>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}