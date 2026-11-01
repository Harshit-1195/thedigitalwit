"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1400;

// Counts from 0 to `value` the first time it scrolls into view. Server render
// and reduced-motion users get the final number straight away.
export function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    setShown(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          const eased = 1 - Math.pow(1 - t, 4);
          setShown(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>
        {prefix}
        {shown.toLocaleString("en-US")}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {value.toLocaleString("en-US")}
        {suffix}
      </span>
    </span>
  );
}
