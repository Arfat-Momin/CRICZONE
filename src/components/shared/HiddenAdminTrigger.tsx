"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
  clicks?: number;
  windowMs?: number;
  className?: string;
};

/**
 * Discreetly navigates to /admin when the wrapped content is
 * triple-clicked (or N-clicked) within a short window.
 *
 * Public visitors never see an admin link. The admin can either
 * triple-click this element or navigate directly to /admin.
 */
export function HiddenAdminTrigger({
  children,
  clicks = 3,
  windowMs = 800,
  className,
}: Props) {
  const router = useRouter();
  const countRef = useRef(0);
  const firstClickAtRef = useRef<number>(0);

  const onClick = useCallback(() => {
    const now = Date.now();
    if (now - firstClickAtRef.current > windowMs) {
      firstClickAtRef.current = now;
      countRef.current = 1;
      return;
    }
    countRef.current += 1;
    if (countRef.current >= clicks) {
      countRef.current = 0;
      firstClickAtRef.current = 0;
      router.push("/admin");
    }
  }, [clicks, router, windowMs]);

  return (
    <span
      role="presentation"
      onClick={onClick}
      className={className}
      style={{ cursor: "default", userSelect: "none" }}
    >
      {children}
    </span>
  );
}