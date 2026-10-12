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
      className="relative overflow-hidden bg-transparent py-14 sm:py-16 md:py-20"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Progress rail */}
        <div className="mb-10 h-[2px] w-full overflow-hidden rounded-full bg-cream/10 sm:mb-14">
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-mint via-success to-[#FFA000]"
            style={reduce ? { scaleX: 1 } : { scaleX }}
          />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative flex flex-col rounded-2xl border border-mint/12 bg-[#050A08]/60 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-mint/35 hover:shadow-[0_20px_60px_-20px_rgba(216,243,220,0.3)] sm:p-6"
            >
              {/* Top glow on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-[radial-gradient(ellipse_at_center,rgba(216,243,220,0.15),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />

              <span className="relative font-[family-name:var(--font-display)] text-3xl font-bold text-mint/30 sm:text-4xl">
                {step.n}
              </span>
              <h3 className="relative mt-3 text-base font-bold text-cream sm:text-lg">
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