"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Tiny top-of-page progress bar. Fires on every pathname change so
 * admin navigation never feels frozen. Uses only transform + opacity.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(15);

    const t1 = window.setTimeout(() => setProgress(60), 120);
    const t2 = window.setTimeout(() => setProgress(90), 400);
    const t3 = window.setTimeout(() => {
      setProgress(100);
      const t4 = window.setTimeout(() => setVisible(false), 180);
      return t4;
    }, 700);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-x-0 top-0 z-[100] h-[2px] bg-transparent"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-success via-mint to-success shadow-[0_0_10px_rgba(216,243,220,0.7)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}