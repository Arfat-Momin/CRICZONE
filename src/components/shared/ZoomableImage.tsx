"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** Pass-through click handler — lightbox still opens (stopPropagation not needed). */
  onImgClick?: () => void;
};

/**
 * Renders an <img> that opens a full-screen lightbox on click.
 * - Smooth fade+scale animation (respects prefers-reduced-motion)
 * - Escape or click backdrop to close
 * - Body scroll locked while open
 * - Renders into a portal so it sits above everything
 * - Uses stopPropagation so parent click handlers (e.g. player modal) don't fire
 */
export function ZoomableImage({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
  onImgClick,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading={loading}
        onClick={(e) => {
          e.stopPropagation();
          onImgClick?.();
          setOpen(true);
        }}
        className={cn("cursor-zoom-in", className, imgClassName)}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="lightbox-backdrop"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
              >
                <motion.img
                  key="lightbox-image"
                  src={src}
                  alt={alt}
                  initial={reduce ? false : { scale: 0.92, opacity: 0.9 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white backdrop-blur transition hover:bg-white/25"
                  aria-label="Close"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}