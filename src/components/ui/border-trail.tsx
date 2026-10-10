"use client";

import type { CSSProperties } from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

type BorderTrailProps = {
  className?: string;
  /** Size of the trail blob (also used for corner rounding). */
  size?: number;
  transition?: Transition;
  delay?: number;
  onAnimationComplete?: () => void;
  style?: CSSProperties;
};

/**
 * Animated trail that circles the border of its parent.
 *
 * The parent element MUST have a `rounded-*` class — the trail inherits
 * the border radius via `rounded-[inherit]`.
 *
 * Uses CSS `offset-path` (supported in all modern browsers) to move the
 * blob around the perimeter.
 */
export function BorderTrail({
  className,
  size = 120,
  transition,
  delay,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const baseTransition: Transition = {
    repeat: Infinity,
    duration: 6,
    ease: "linear",
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <motion.div
        className={cn("absolute aspect-square rounded-full bg-mint", className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{
          ...(transition ?? baseTransition),
          delay,
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}