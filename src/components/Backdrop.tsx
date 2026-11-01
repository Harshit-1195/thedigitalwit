"use client";

import { usePathname } from "next/navigation";

/**
 * Fixed, decorative colour fields that the glass panels blur. Red on most
 * pages, charcoal on sell-side pages, matching the pillar accent.
 */
export function Backdrop() {
  const sell = usePathname().startsWith("/sell-side");
  const main = sell ? "rgb(26 26 26 / 0.22)" : "rgb(216 35 42 / 0.30)";
  const second = sell ? "rgb(120 120 120 / 0.22)" : "rgb(216 35 42 / 0.16)";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="backdrop-blob" style={{ width: "42vw", height: "42vw", left: "-10vw", top: "-8vw", background: main }} />
      <div className="backdrop-blob" style={{ width: "36vw", height: "36vw", right: "-8vw", top: "28vh", background: second, animationDelay: "-12s" }} />
      <div className="backdrop-blob" style={{ width: "30vw", height: "30vw", left: "30vw", bottom: "-12vw", background: main, animationDelay: "-24s" }} />
    </div>
  );
}
