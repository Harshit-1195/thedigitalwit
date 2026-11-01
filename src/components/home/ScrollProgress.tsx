"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Writes how far the section has scrolled past the top of the viewport
// (0 → 1) into the CSS variable --p, so children can drive parallax with
// plain calc(). Skipped entirely under prefers-reduced-motion.
export function ScrollProgress({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className={className} style={{ "--p": 0 } as React.CSSProperties}>
      {children}
    </section>
  );
}
