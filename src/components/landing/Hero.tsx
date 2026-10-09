"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(216,243,220,0.65), transparent 45%), radial-gradient(circle at 85% 60%, rgba(45,106,79,0.12), transparent 50%), radial-gradient(circle at 50% 100%, rgba(216,243,220,0.5), transparent 55%)",
        }}
      />

      {/* Animated cricket ball — desktop only to avoid layout drama on mobile */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute hidden h-4 w-4 rounded-full bg-sold shadow-[0_0_24px_rgba(193,18,31,0.55)] md:block"
          style={{ top: "42%", left: "12%" }}
          animate={{
            x: [0, 180, 360, 540, 360, 180, 0],
            y: [0, -120, -180, -60, 80, 120, 0],
            scale: [1, 1.15, 1.25, 1.15, 1, 1, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.15, 0.35, 0.5, 0.7, 0.85, 1],
          }}
        />
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40"
      >
        <motion.span
          variants={itemVariants}
          className="inline-flex items-center gap-2 rounded-full border border-[#1B4332]/15 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2D6A4F] backdrop-blur"
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sold" />
          Live Turf Cricket Auctions
        </motion.span>

        <motion.h1
          variants={itemVariants}
          className="mt-6 max-w-4xl text-5xl font-bold leading-[1.05] text-forest md:text-6xl lg:text-7xl"
        >
          Run and watch cricket auctions,{" "}
          <span className="italic text-[#2D6A4F]">reimagined.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-[#1B4332]/70 md:text-xl"
        >
          CRICZONE is a real-time tournament auction platform. Run multiple leagues in
          parallel, host live bidding from any device, and give your audience a
          broadcast-quality experience — instantly.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="#tournaments"
            className="rounded-xl bg-forest px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-cream shadow-lg shadow-[#1B4332]/20 transition hover:-translate-y-0.5 hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
          >
            Browse Tournaments
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-xl border-2 border-[#1B4332]/25 bg-transparent px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-forest transition hover:-translate-y-0.5 hover:border-[#2D6A4F] hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
          >
            How It Works
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}