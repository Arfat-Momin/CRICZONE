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
  onImgClick?: () => void;
  /** Optional high-resolution URL used only in the lightbox. Falls back to `src`. */
  zoomSrc?: string;
};

/**
 * Upgrades common demo-image URLs to a larger variant so the lightbox
 * shows a crisp, uncropped, high-quality version.
 *
 * Real production photos (Supabase Storage, direct URLs) pass through
 * unchanged — the originals are already full size.
 */
function upgradePhotoUrl(url: string): string {
  if (!url) return url;

  // pravatar.cc — the 500px default is too soft for a full-screen view
  const pravatar = url.match(
    /^https?:\/\/i\.pravatar\.cc\/(?:\d+)?\??(.*)$/i,
  );
  if (pravatar) {
    const query = pravatar[1] ?? "";
    // query is like "img=12" or "img=12&foo=bar"
    return `https://i.pravatar.cc/1000?${query}`;
  }

  // picsum.photos — bump any size to 1200x1200
  const picsumSize = url.match(
    /^https?:\/\/picsum\.photos\/seed\/([^/]+)\/\d+\/\d+(\?.*)?$/i,
  );
  if (picsumSize && picsumSize[1]) {
    const seed = picsumSize[1];
    const query = picsumSize[2] ?? "";
    return `https://picsum.photos/seed/${seed}/1200/1200${query}`;
  }
  const picsumId = url.match(
    /^https?:\/\/picsum\.photos\/(?:id\/)?(\d+)\/\d+\/\d+(\?.*)?$/i,
  );
  if (picsumId && picsumId[1]) {
    const id = picsumId[1];
    const query = picsumId[2] ?? "";
    return `https://picsum.photos/id/${id}/1200/1200${query}`;
  }

  return url;
}

export function ZoomableImage({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
  onImgClick,
  zoomSrc,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(true);
  const [zoomError, setZoomError] = useState(false);
  const reduce = useReducedMotion();

  const effectiveZoomSrc = zoomSrc ?? upgradePhotoUrl(src);

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

  // Reset loading state each time the lightbox opens
  useEffect(() => {
    if (open) {
      setZoomLoading(true);
      setZoomError(false);
    }
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
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
              >
                {/* Loading spinner */}
                {zoomLoading && !zoomError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-mint" />
                  </div>
                )}

                {/* Error fallback */}
                {zoomError && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-6 py-8 text-center text-cream">
                    <span className="text-3xl" aria-hidden>
                      🖼️
                    </span>
                    <p className="text-sm font-semibold">
                      Could not load this image
                    </p>
                    <a
                      href={effectiveZoomSrc}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold uppercase tracking-wider text-mint underline"
                    >
                      Open original
                    </a>
                  </div>
                )}

                {/* The image — object-contain shows the full frame */}
                {!zoomError && (
                  <motion.img
                    key={`lightbox-${effectiveZoomSrc}`}
                    src={effectiveZoomSrc}
                    alt={alt}
                    initial={reduce ? false : { scale: 0.94, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: zoomLoading ? 0 : 1,
                    }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    onLoad={() => setZoomLoading(false)}
                    onError={() => {
                      setZoomLoading(false);
                      setZoomError(true);
                    }}
                    className="max-h-[92vh] max-w-[94vw] rounded-xl object-contain shadow-2xl"
                    style={{
                      imageRendering: "-webkit-optimize-contrast",
                      willChange: "transform, opacity",
                    }}
                  />
                )}

                {/* Close button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white transition hover:bg-white/30 sm:right-5 sm:top-5"
                  aria-label="Close"
                >
                  ×
                </button>

                {/* Hint */}
                <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/45">
                  Click anywhere or Esc to close
                </p>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}