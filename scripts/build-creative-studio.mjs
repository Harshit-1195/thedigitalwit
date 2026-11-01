// Builds public/tools/creative-studio.html from tools-src/ad-format-studio.original.html,
// restyled to thedigitalwit. Run: npm run build:studio (after replacing the original file).
// Every replacement must match exactly once, or the script stops.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../tools-src/ad-format-studio.original.html", import.meta.url);
const OUT = new URL("../public/tools/creative-studio.html", import.meta.url);
let html = readFileSync(SRC, "utf8");

function swap(label, find, repl) {
  const n = html.split(find).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 match, found ${n}`);
  html = html.replace(find, () => repl);
  console.log("ok", label);
}

// 1. Head: site title, self-hosted fonts instead of Google Fonts (IBM Plex).
swap(
  "head",
  `<title>Ad Format Studio</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">`,
  `<title>Creative Studio · thedigitalwit</title>
<link rel="stylesheet" href="/tools/fonts/fonts.css">`,
);

// 2. Tokens mapped to thedigitalwit (PROJECT_SPEC §5 + glass update).
swap(
  "tokens",
  `:root{
  --ui:#ffffff; --ui2:#f5f6f8; --canvas:#e3e5e9; --dot:rgba(30,40,60,.13);
  --section:#eef0f3; --section-line:#d5d9df; --line:#e1e4e8;
  --fg:#15181d; --muted:#5f6671; --faint:#959ba5;
  --accent:#0b85e6; --accent-soft:#e2f0fc; --accent-fg:#ffffff;
  --s5:#11994f; --s4:#5e9d1d; --s3:#c98700; --s2:#de5a0d; --s1:#d22e2e;
  --pass:#11994f; --warn:#b67a00; --fail:#d22e2e; --info:#7b818b;
  --shadow:0 8px 28px rgba(16,24,40,.16);
  --f-ui:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --f-mono:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;
}`,
  `/* thedigitalwit tokens. Score colours keep the red→green order, darkened for 4.5:1 text contrast. */
:root{
  --ui:#ffffff; --ui2:#f6f4f4; --canvas:rgba(255,255,255,.5); --dot:rgba(17,17,17,.13);
  --section:rgba(255,255,255,.55); --section-line:rgba(17,17,17,.06); --line:#e4e4e4;
  --fg:#111111; --muted:#555555; --faint:#737373;
  --accent:#D8232A; --accent-strong:#A81820; --accent-soft:#FDEAEA; --accent-fg:#ffffff;
  --s5:#15803D; --s4:#65A30D; --s3:#F59F00; --s2:#C2410C; --s1:#B91C1C;
  --pass:#15803D; --warn:#B45309; --fail:#B91C1C; --info:#6B6B6B;
  --shadow:0 24px 60px -20px rgba(17,17,17,.35);
  --f-ui:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;
  --f-display:'Sora','Inter',system-ui,sans-serif;
}`,
);

// 3. The site has no dark mode: drop both dark blocks so the tool always matches.
swap(
  "dark mode",
  `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --ui:#1d1f23; --ui2:#24272c; --canvas:#131417; --dot:rgba(255,255,255,.07);
  --section:#1a1c20; --section-line:#2b2e34; --line:#2c2f35;
  --fg:#e8eaee; --muted:#a3a9b3; --faint:#6f7680;
  --accent:#3a9ef5; --accent-soft:#17324c; --accent-fg:#ffffff;
  --warn:#e2a41c; --info:#8d939d; --shadow:0 8px 28px rgba(0,0,0,.5);
  color-scheme:dark}}
:root[data-theme="dark"]{
  --ui:#1d1f23; --ui2:#24272c; --canvas:#131417; --dot:rgba(255,255,255,.07);
  --section:#1a1c20; --section-line:#2b2e34; --line:#2c2f35;
  --fg:#e8eaee; --muted:#a3a9b3; --faint:#6f7680;
  --accent:#3a9ef5; --accent-soft:#17324c; --accent-fg:#ffffff;
  --warn:#e2a41c; --info:#8d939d; --shadow:0 8px 28px rgba(0,0,0,.5);
  color-scheme:dark}
`,
  "",
);

// 4. Component restyle: pill buttons, glass bars/panels/menus, site focus ring.
//    Nothing inside .ad (the mockups themselves) is touched.
swap(
  "style overrides",
  `@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>`,
  `@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}

/* ---------- thedigitalwit design: glass, rounded, red and white ---------- */
html{background:#fff}
body{background:
  radial-gradient(42vw 42vw at 0% 0%,rgba(216,35,42,.20),transparent 70%),
  radial-gradient(36vw 36vw at 100% 40%,rgba(216,35,42,.10),transparent 70%),
  radial-gradient(30vw 30vw at 40% 110%,rgba(216,35,42,.16),transparent 70%),#fff}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:4px}
.top,.sub,.pvbar{background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border-color:rgba(17,17,17,.08)}
.mark{font:800 15px/1 var(--f-display);letter-spacing:-.03em}
.mark .logo{width:26px;height:26px;border-radius:8px;background:var(--accent);color:#fff;display:grid;place-items:center;font:800 14px/1 var(--f-display)}
.btn{border-radius:999px;height:32px;padding:0 14px;font-weight:600;background:rgba(255,255,255,.78);border-color:rgba(17,17,17,.16)}
.btn:hover{background:#fff}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn.primary:hover{background:var(--accent-strong);filter:none}
.btn.sm{height:28px;padding:0 11px}
.ibtn{border-radius:999px}
.mb{border-radius:999px;padding:0 12px;font-weight:600}
.mb[aria-expanded="true"]{background:var(--fg);color:#fff}
.mb[aria-expanded="true"] .n{color:rgba(255,255,255,.75)}
.pop{border-radius:18px;background:rgba(255,255,255,.9);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border-color:rgba(255,255,255,.85);box-shadow:0 0 0 1px rgba(17,17,17,.08),0 24px 60px -20px rgba(17,17,17,.35)}
.panel{background:rgba(255,255,255,.74);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%)}
#right{border-left-color:rgba(17,17,17,.08)}
.psec{border-bottom-color:rgba(17,17,17,.08)}
.inp{height:32px;border:1.5px solid var(--fg);border-radius:10px;background:rgba(255,255,255,.85)}
textarea.inp{border-radius:12px}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.colorf{border:1.5px solid var(--fg);border-radius:10px;background:rgba(255,255,255,.85)}
.seg{border-radius:999px;background:rgba(17,17,17,.06);border-color:transparent;padding:3px}
.seg button{border-radius:999px;color:var(--muted)}
.seg button[aria-pressed="true"]{background:var(--fg);color:#fff;box-shadow:none}
.score,.note{border-radius:16px;background:rgba(255,255,255,.7)}
.score .num{border-radius:999px}
.chip{border-radius:999px}
.s3,.s4{color:#111!important}
.sec{border-radius:48px;background:var(--section);border-color:var(--section-line);box-shadow:0 12px 40px -16px rgba(17,17,17,.18)}
.sec-title{font-family:var(--f-display);font-weight:800;color:var(--fg);letter-spacing:-.04em}
.rp-title h2{font-family:var(--f-display);font-weight:700;letter-spacing:-.03em}
.tag{background:var(--accent-soft);color:var(--accent-strong);border-radius:999px;padding:3px 7px}
.lrow,.elrow,.attn button{border-radius:12px}
.thumb{border-radius:14px}
.seltb,.seltb button{border-radius:999px}
.hint{border-radius:999px;background:rgba(255,255,255,.88)}
.mbox{border-radius:24px}
#toast{border-radius:16px}
.mhead .sw{margin-right:2px}
</style>`,
);

// 5. Top bar: site mark and name.
swap(
  "wordmark",
  `<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="1" y="1" width="11" height="7" rx="1.5" fill="var(--accent)"/><rect x="1" y="10" width="5" height="9" rx="1.5" fill="var(--s3)"/><rect x="8" y="10" width="11" height="9" rx="1.5" fill="var(--fg)" opacity=".85"/><rect x="14" y="1" width="5" height="7" rx="1.5" fill="var(--s5)"/></svg>
      <span class="hide-sm">Ad Format Studio</span><small>IAB · LEAN</small>`,
  `<span class="logo" aria-hidden="true">w</span>
      <span class="hide-sm">Creative Studio</span><small>IAB · LEAN</small>`,
);

// 6. Libraries served from the site, not a third-party CDN.
swap("qrcode", `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>`, `<script src="/tools/vendor/qrcodejs-1.0.0.min.js"></script>`);
swap("jszip", `<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>`, `<script src="/tools/vendor/jszip-3.10.1.min.js"></script>`);

// 7. Remaining hard-coded blue selection outlines -> accent.
swap("pvad hover", ".pvad:hover{outline:2px solid #0b85e6;outline-offset:2px}", ".pvad:hover{outline:2px solid var(--accent);outline-offset:2px}");
swap("pvad on", ".pvad.on{outline:3px solid #0b85e6;outline-offset:2px}", ".pvad.on{outline:3px solid var(--accent);outline-offset:2px}");
swap("boxes", "rgba(11,133,230,.75)", "rgba(216,35,42,.75)");

// 8. Tool name in exported files: VAST AdSystem (every builder), encoding-command
//    comments and the zip README. The title and wordmark were renamed above.
{
  const n = html.split("Ad Format Studio").length - 1;
  if (!n) throw new Error('rename: no "Ad Format Studio" left to rename; check the source');
  html = html.replaceAll("Ad Format Studio", "Creative Studio");
  console.log(`ok rename (${n}× "Ad Format Studio" -> "Creative Studio")`);
}

for (const leftover of ["cdnjs.cloudflare.com", "fonts.googleapis.com", "IBM Plex", "#0b85e6"]) {
  const n = html.split(leftover).length - 1;
  console.log(n ? `NOTE ${n}× "${leftover}" remains` : `clean: no "${leftover}"`);
}
writeFileSync(OUT, html);
console.log("written", OUT.pathname, html.length, "bytes");
