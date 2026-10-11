"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * CRICZONE — Night Stadium Hero
 *
 * Drop a night-cricket image at:
 *   public/images/hero-night-cricket.jpg
 * If the file is missing, the dark gradient fallback keeps the page beautiful.
 */

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden bg-[#050A08] text-cream"
    >
      {/* ============ LAYER 1: Background image ============ */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={reduce ? undefined : { y: imageY, scale: imageScale }}
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

      {/* ============ LAYER 2: Fallback gradient (visible if image fails) ============ */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_top,#0F231A_0%,#050A08_70%)]"
      />

      {/* ============ LAYER 3: Readability gradients ============ */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-[#050A08]/85 via-[#050A08]/55 to-[#050A08]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-r from-[#1B4332]/45 via-transparent to-[#1B4332]/35"
      />

      {/* ============ LAYER 4: Floodlight glow from top ============ */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-[70%] bg-[radial-gradient(ellipse_at_top,rgba(255,232,184,0.16),transparent_60%)]"
      />

      {/* ============ LAYER 5: Conic light beams ============ */}
      {!reduce && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[20%] left-1/2 -z-10 h-[140%] w-[70%] -translate-x-1/2 opacity-40 mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,232,184,0.22) 8deg, transparent 18deg, transparent 342deg, rgba(255,232,184,0.22) 352deg, transparent 360deg)",
              filter: "blur(6px)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[20%] left-[30%] -z-10 h-[140%] w-[45%] -translate-x-1/2 rotate-[-10deg] opacity-25 mix-blend-screen"
            style={{
              background:
                "linear-gradient(180deg, rgba(216,243,220,0.35) 0%, transparent 70%)",
              filter: "blur(14px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-[20%] right-[30%] -z-10 h-[140%] w-[45%] translate-x-1/2 rotate-[10deg] opacity-25 mix-blend-screen"
            style={{
              background:
                "linear-gradient(180deg, rgba(216,243,220,0.35) 0%, transparent 70%)",
              filter: "blur(14px)",
            }}
          />
        </>
      )}

      {/* ============ LAYER 6: Grain ============ */}
      <div aria-hidden className="hero-grain absolute inset-0 -z-10" />

      {/* ============ FLOATING CRICKET BALL ============ */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[12%] top-[28%] hidden h-5 w-5 rounded-full bg-sold shadow-[0_0_32px_rgba(193,18,31,0.7),0_0_80px_rgba(193,18,31,0.35)] md:block"
          animate={{
            x: [0, -180, -320, -180, 0],
            y: [0, -80, -40, 100, 0],
            scale: [1, 1.1, 1.2, 1.05, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* ============ CONTENT ============ */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:py-28 lg:py-32"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.3em] text-mint backdrop-blur">
              <span className="cz-pulse-dot inline-block h-2 w-2 rounded-full bg-sold" />
              Live Turf Cricket Auctions
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 font-[family-name:var(--font-display)] text-[2.6rem] font-bold leading-[1.02] tracking-tight text-cream text-glow-mint md:text-6xl lg:text-7xl"
          >
            The auction floor,
            <br />
            <span className="italic text-mint text-glow-warm">
              under the lights.
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-base leading-relaxed text-cream/75 md:text-lg"
          >
            CRICZONE is the real-time tournament auction platform built for turf
            cricket. Run multiple leagues in parallel, host live bidding from any
            device, and give your crowd a broadcast-quality experience — all from
            one link.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="#tournaments"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-mint px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_10px_40px_-10px_rgba(216,243,220,0.6)] transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
            >
              <span className="relative z-10">Browse tournaments</span>
              <span
                aria-hidden
                className="relative z-10 transition group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-cream/25 bg-cream/5 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-cream backdrop-blur transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
            >
              How it works
            </Link>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-widest text-cream/55"
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
      </motion.div>

      {/* ============ SCROLL CUE ============ */}
      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-cream/40 md:flex"
      >
        <span>Scroll</span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block h-6 w-[1px] bg-gradient-to-b from-cream/60 to-transparent"
        />
      </div>

      {/* ============ BOTTOM FADE → NEXT SECTION ============ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A1410] to-transparent"
      />
    </section>
  );
}