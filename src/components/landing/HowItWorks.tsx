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
      className="relative mx-auto max-w-7xl px-6 py-20 md:py-28"
    >
      <div className="mb-14 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F]">
          The Flow
        </span>
        <h2 className="mt-2 text-3xl font-bold text-forest md:text-4xl">
          From kickoff to final bid
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1B4332]/65">
          A tournament lives through four clean stages. Everything is real-time and
          visible to anyone with the link.
        </p>
      </div>

      {/* Progress rail */}
      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-[#1B4332]/10">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#D8F3DC]"
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
            className="relative rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm"
          >
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#2D6A4F]/25">
              {step.n}
            </span>
            <h3 className="mt-3 text-lg font-bold text-forest">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#1B4332]/65">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}