"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Create a tournament",
    body: "Set the name, venue, start time, and toggle registration. Each tournament gets its own unique public URL.",
  },
  {
    n: "02",
    title: "Open player registration",
    body: "Share your link. Players register with a photo and details. Mobile numbers are enforced unique per tournament.",
  },
  {
    n: "03",
    title: "Build groups & teams",
    body: "Organize players into batches (groups) and configure captains with starting points and squad limits.",
  },
  {
    n: "04",
    title: "Go live and sell",
    body: "Draw players on the block, capture bids from any device, and trigger cinematic SOLD and UNSOLD moments.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#050A08] py-20 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_at_top,rgba(216,243,220,0.08),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-mint">
            The Flow
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-cream md:text-4xl">
            From kickoff to final bid
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-cream/60">
            A tournament lives through four clean stages. Everything is real-time
            and visible to anyone with the link.
          </p>
        </div>

        <div className="mb-12 h-[2px] w-full overflow-hidden rounded-full bg-cream/10">
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-mint via-success to-[#FFA000]"
            style={reduce ? { scaleX: 1 } : { scaleX }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl border border-mint/12 glass-dark p-6 transition hover:border-mint/35"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-[radial-gradient(ellipse_at_center,rgba(216,243,220,0.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="relative font-[family-name:var(--font-display)] text-4xl font-bold text-mint/30">
                {step.n}
              </span>
              <h3 className="relative mt-3 text-lg font-bold text-cream">
                {step.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-cream/60">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}