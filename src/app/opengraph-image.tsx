import { ImageResponse } from "next/og";
import { COUNTS } from "@/lib/calculators/data";

// The preview image shown when a link to the site is shared.
export const alt = "thedigitalwit: free ad KPI calculators and media tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -2, color: "#111111" }}>
          thedigital<span style={{ color: "#D8232A" }}>wit</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 120, fontWeight: 800, lineHeight: 0.9, letterSpacing: -6 }}>
          <span style={{ color: "#111111" }}>Ad math,</span>
          <span style={{ color: "#111111" }}>minus the</span>
          <span style={{ color: "#D8232A" }}>invoice.</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 30, color: "#111111" }}>
          <span style={{ background: "#D8232A", color: "#fff", padding: "8px 18px" }}>{COUNTS.total} free calculators</span>
          <span style={{ padding: "8px 0" }}>Buy-side · Sell-side · No login needed</span>
        </div>
      </div>
    ),
    size,
  );
}
