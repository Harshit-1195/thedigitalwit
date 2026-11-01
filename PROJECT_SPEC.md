# thedigitalwit: Project Spec (source of truth)

> Re-read this file at the start of every phase. Sections 1–6 are the owner's
> brief, kept verbatim. Section 7 is a running log of implementation decisions.

I'm building "thedigitalwit", a free, self-serve reference hub for digital
advertising. I am not a developer, so please work in phases, explain what you did
in plain language after each phase, tell me exactly how to run and check it, and
STOP at the end of each phase until I say "continue".

TECH STACK: Next.js (App Router, TypeScript) and Tailwind CSS. For login and
saved items, use Supabase (auth plus database), since the site needs a backend for
accounts. If you think a different auth/database choice is clearly better for a
non-developer, tell me why before building it.

=====================================================================
1. THE PRODUCT
=====================================================================
Two equally weighted pillars, plus supporting tools:
- BUY-SIDE: 63 KPI calculators across 13 verticals, for media buyers.
- SELL-SIDE: 12 KPI calculators, for publishers and monetization teams.
- Supporting tools: Media Mix Model, GTM Generator, Media Planning Tool, Mockup
  Studio, Creative Specs Library.
- Knowledge: Governance (AI in advertising).
Goal: replace tools that normally cost hundreds to hundreds of thousands of
dollars a year with something anyone in the industry can open and use for free.
Nobody has to log in to use anything. Login only unlocks saving your work.

The 13 buy-side verticals: Universal, Display/Programmatic, Video, Audio, CTV,
Native, Social, App/Mobile, Ecommerce/Shopping, DOOH, Crypto, Healthcare, Gaming.

The 12 sell-side calculators: RPM, Seller eCPM, Fill Rate, Viewable Fill Rate,
Header Bidding Win Rate, Publisher Take-Home Rate, Publisher ARPU, PG Realization
Rate, Direct Revenue Mix, Header Bidding CPM Uplift, Revenue per Available Ad
Slot, Ad Load.

=====================================================================
2. SITE MAP (every page gets its own route)
=====================================================================
/                                  Home
/buy-side                          Buy-side hub
/buy-side/calculators/[id]         One template serving all 63 calculators
/sell-side                         Sell-side hub
/sell-side/calculators/[id]        Same template, serving all 12
/media-mix-model
/gtm-generator
/media-planning
/mockup-studio
/creative-specs
/governance
/login
Search lives in the header on every page (not a separate page).

HEADER (every page): wordmark left linking home; Buy-Side and Sell-Side as two
separate, equally weighted top-level items; a "Strategy" group (GTM Generator,
Media Planning); a "Tools" group (Mockup Studio, Creative Specs, Media Mix
Model); a "Knowledge" group (Governance); a search box; a "Log in" button on the
right. Smooth scrolling for any in-page anchors. Mobile-friendly menu.

=====================================================================
3. WHAT'S ON EACH PAGE
=====================================================================
HOME
- Hero carried by large display type, no stock imagery.
- Two equal-size cards: Buy-Side and Sell-Side. Same size, same weight.
- Stats row that counts up from 0 when scrolled into view: 75 calculators, 13
  buy-side verticals, 12 sell-side calculators, "$0 to start".
- Infinite scrolling strip of short, sharp KPI one-liners (the "wit" of the
  brand, e.g. "CPM: what you pay to be seen, not clicked."). Pause on hover.
  Respect prefers-reduced-motion.
- Numbered index list (01, 02, 03...) introducing the supporting tools, styled
  like a table of contents rather than icon cards.
- One short pull-quote block (single voice, no carousel).
- Footer: links to every page (the contact column was removed on 2026-11-01 at the owner's request).

BUY-SIDE HUB
- Short intro. Filter chips, one per vertical. Search scoped to these 63.
- Calculators grouped by vertical; each card shows name plus a one-line
  description and links to its page.

SELL-SIDE HUB
- Same layout as the buy-side hub, scoped to the 12 sell-side calculators, and
  visually distinguished by accent color so it's instantly clear which side you
  are on.

CALCULATOR PAGE (one template, used by all 75)
1. Breadcrumb (vertical, link back to hub)
2. Title and one-line description
3. Interactive panel: every variable is an editable field. NO field is
   input-only; any of them can be typed into.
4. A small badge on each field: "input", "solved", or "waiting"
5. A visible formula line, e.g. "CPM = (Spend ÷ Impressions) × 1000"
6. "Load example" button (fills all fields except the last from their default
   values) and "Reset" button
7. Four color-coded explanation cards below:
   a. WHAT IS [metric]?  from the "about" text
   b. WORKED EXAMPLE  computed LIVE from the default values using the same
      solver (never hardcoded), e.g. "If spend is $5,000 and impressions is
      1,200,000, then CPM = $4.17."
   c. FORMULA VARIABLE BREAKDOWN  every variable, its key and label, with one
      line saying: enter it directly, or leave it blank and let the solver
      calculate it from the other fields
   d. TACTICAL APPLICATION GUIDE  one short paragraph per relation type on how to
      use fill-any-two-solve-the-third for planning, naming the specific metric
8. "More in [vertical]" links to sibling calculators
9. A disabled tab labeled "Natural Language AI (soon)" next to "Interactive
   Fields". Do NOT build it yet.

MEDIA MIX MODEL
- A table the user builds: one row per channel, columns for spend and results,
  add/remove rows freely. On submit, fit a diminishing-returns curve per channel
  (server-side) and return a suggested reallocation plus a plain-language
  confidence note based on how much data was entered. Be honest in the UI that
  this is a simplified first-pass model, not full Bayesian MMM.

GTM GENERATOR
- Short form: product type, target audience, launch timeline, budget ceiling.
  Output: sequenced plan (which channels first/second/third), budget split by
  phase, and which KPIs to watch at each stage, using real calculator names that
  link to those calculator pages.

MEDIA PLANNING TOOL
- Inputs: total budget, target CAC or ROAS, channels in scope. Output: suggested
  spend split by channel, adjustable by hand, with the target updating live.

MOCKUP STUDIO
- Upload a static image or short video; preview inside realistic placement frames
  (mobile feed, desktop leaderboard, CTV) so cropping and legibility problems
  show up before trafficking. Simple frames are fine to start.

CREATIVE SPECS LIBRARY
- Searchable, filterable reference table of ad sizes and file specs by format:
  Display (IAB standard units), Native, Video, Audio, CTV, DOOH, Social, Rich
  Media. Store the data in a structured data file so it's easy to extend.

GOVERNANCE
- Static knowledge page: AI use in media buying, disclosure norms,
  generative-creative policy by platform, data and consent basics. Write a solid
  first draft and mark anything platform-specific as "verify against current
  platform policy" since these rules change.

LOGIN (/login)
- Three options: Google, Microsoft (covers Outlook accounts), and email with
  verification.
- Google and Microsoft: standard one-click "continue with" OAuth sign-in.
- Email: the user enters their email address and signs up or in with email
  verification (a confirmation link or one-time code sent to the inbox). Account
  is only active once the email is verified. Show clear states for "check your
  inbox", "link expired", and "resend" (with a short cooldown between resends).
- If someone signs in with Google or Microsoft using the same email as an existing
  email account, link them to the same account instead of creating a duplicate.
- Keep all keys and credentials in environment variables with a documented
  .env.example. I will supply real credentials later, so build with clearly
  marked placeholders, and give me plain-language steps for setting up the Google
  and Microsoft sign-in apps.
- WhatsApp or phone sign-in is NOT part of this build. Do not add it.
- Signed-in users get "My saved items": saved calculator scenarios, and saved
  Media Planning and GTM Generator outputs.

SEARCH (header)
- Searches all 75 calculator names and descriptions plus all page names. Results
  dropdown grouped Buy-Side / Sell-Side / Pages. Keyboard navigable.

=====================================================================
4. CALCULATOR LOGIC (the core of the product, implement exactly)
=====================================================================
DATA: buyside-calculators.json and sellside-calculators.json. Each calculator has:
id, cat (category code), name, relation, optional k, vars[] (each with key, label,
unit, default d, optional scale), about, formulaDisplay. The LAST var is the
named output metric, but the engine must treat ALL vars as equally solvable.
Load these files as data; do not hand-write 75 separate calculators.

FIVE RELATION TYPES (A, B, X refer to vars in order; X is last):
- RATIO2:  X = (A / B) * k.
    Given A,B -> X.  Given A,X -> B = (A*k)/X.  Given B,X -> A = (X*B)/k.
- ROI2:  X = ((A - B) / B) * 100.
    Given A,B -> X.  Given B,X -> A = B*(1 + X/100).  Given A,X -> B = A/(1 + X/100).
- INVERSE1:  X = k / A (only two vars).
    Given A -> X.  Given X -> A = k/X.
- PRODUCT2_SCALED:  X = A * (B * scale), where B carries its own "scale" (0.01 for
  a percent input).
    Given A,B -> X.  Given A,X -> B = (X/A)/scale.  Given B,X -> A = X/(B*scale).
- PRODUCT3:  X = A * B * C (four vars). Needs THREE of the four known to solve the
  fourth; with fewer, show nothing yet.
Guard every division: if the denominator is zero or a value is missing or not
finite, show an empty "waiting" state, never NaN or Infinity.

OMNI-DIRECTIONAL FIELD BEHAVIOR:
- Keep a "touch order" counter per field, incremented every time the user edits
  that field. All fields start untouched.
- At all times the TARGET field (the one being solved, displayed highlighted with
  the "solved" badge) is the field with the LOWEST touch order, i.e. edited
  longest ago. Ties go to the last-declared var, so on a fresh page the named
  output metric is the default target.
- Every other field is a live input. Recompute on every keystroke.
- Example: fill Spend, then Impressions -> CPM solves. Now edit CPM directly ->
  Spend (touched before Impressions) becomes the solved field and Impressions
  stays exactly as typed.
- Clearing a field resets its touch order to untouched.
- Number formatting: thousands separators, 2 decimals for results, $ prefix for
  "$" units, % or x suffix for "%" and "x" units. Accept pasted numbers with
  commas.
- Write unit tests for the solver covering all five relation types in every
  direction (including LTV with each of its four vars as the unknown) and the
  touch-order rule.

=====================================================================
5. DESIGN: RED AND WHITE
=====================================================================
Reference for feel: https://www.huuuuue.agency/ (bold agency-site energy: large
type, strong motion, confident layout). Borrow the feel, not the content.
- Background white #FFFFFF; raised surfaces #FAFAFA; text near-black #111111.
- Primary red #D8232A (CTAs, active nav, links); dark red #A81820 (hover/pressed);
  light red tint #FDEAEA (badges, soft backgrounds).
- Sell-side pages swap the red accent for black/charcoal #1A1A1A, so the pillars
  are distinguishable without adding a third color family.
- Type: confident, slightly condensed sans for headings with tight letter-spacing
  (Sora or Inter); Inter for body; a monospace (IBM Plex Mono or JetBrains Mono)
  ONLY for calculator numbers and formulas.
- High contrast, bold, closer to a financial terminal than a lifestyle brand. No
  pastel gradients, no generic centered-hero-stat template look.
- Parallax or scroll-driven motion on Home, smooth scrolling, count-up stats.
  Everything must work with prefers-reduced-motion and be keyboard accessible with
  visible focus states and good color contrast.
- Responsive down to 360px wide.

=====================================================================
6. PHASES (stop after each and wait for me to say "continue")
=====================================================================
PHASE 1: Project setup, PROJECT_SPEC.md, design system, header and footer, all
  routes as clean on-brand placeholders (no 404s), and the fully built Home page.
PHASE 2: The calculator engine (solver plus tests) and the buy-side hub and
  calculator template, loading buyside-calculators.json. Verify at least one
  calculator of each relation type works in every direction.
PHASE 3: The sell-side hub and calculators, reusing the same engine and template
  with the sell-side accent. Update Home counts to real numbers from the data.
PHASE 4: Creative Specs Library, Governance, and Search.
PHASE 5: Media Planning Tool, GTM Generator, Media Mix Model, Mockup Studio.
PHASE 6: Login (Google, Microsoft, and email with verification, using
  placeholders for credentials) and "My saved items".
PHASE 7: Polish and launch prep: fix console errors and broken links, check mobile
  layouts, write a README with setup steps and a .env.example, and give me
  step-by-step deployment instructions written for a first-timer.

=====================================================================
7. IMPLEMENTATION DECISIONS LOG (kept up to date by the builder)
=====================================================================
- Phase 1 (2026-10-30)
  - Backend choice: Supabase confirmed. It covers Google + Microsoft ("azure"
    provider) + email magic link/OTP in one dashboard, links identities that
    share a verified email automatically, and its free tier fits a launch.
  - Versions pinned: Node 24.21.0 LTS, Next.js 16.4.1, React 19.3.1,
    Tailwind CSS 4.3.3, TypeScript 5.9.3.
  - Node is installed user-locally at ~/.local/node (no admin rights needed).
  - Fonts: Sora (headings), Inter (body), JetBrains Mono (numbers/formulas),
    loaded via next/font (self-hosted at build time, no runtime Google calls).
  - Design tokens live in src/app/globals.css (@theme). Sell-side swaps the
    accent by wrapping pages in `data-side="sell"`.
  - Navigation config lives in src/lib/site.ts so header, footer and (later)
    search share one list of pages.
  - The calculator JSON files (buyside-calculators.json,
    sellside-calculators.json) have NOT been provided yet. Phase 2 needs them;
    if they don't arrive, the builder will author them to this spec's schema.
- Phase 2 (2026-10-30)
  - No calculator JSON was supplied, so src/data/buyside-calculators.json was
    authored by the builder (63 calculators: UNI 9, DSP 5, VID 5, AUD 4, CTV 5,
    NAT 4, SOC 5, APP 5, ECM 5, DOOH 4, CRY 4, HLT 4, GAM 4). OWNER TO REVIEW
    names, definitions and defaults. The output var's `d` is computed by the
    solver, not typed by hand.
  - Vertical codes -> labels/anchors live in src/lib/calculators/data.ts.
  - Card one-line descriptions = first sentence of `about` (no new field).
  - Engine: src/lib/calculators/{solver,fields,format,copy}.ts. PRODUCT
    relations apply each var's optional `scale` (spec'd for PRODUCT2_SCALED B;
    also allowed in PRODUCT3, e.g. CVR % in Revenue Forecast).
  - Touch order uses one global clock: each edit stamps the field with ++clock;
    clearing sets 0. Before every edit the current target's solved value is
    copied into its raw text, so a field that stops being solved keeps showing
    the number the user last saw.
  - UX: a field cleared while focused stays empty (solved value shown as its
    placeholder) until blur, rather than refilling under the cursor.
  - Tests: `npm test` (Vitest). Includes a round-trip of every var of every
    calculator.
- Phase 3 (2026-10-30)
  - src/data/sellside-calculators.json authored by the builder with the 12
    spec names verbatim. OWNER TO REVIEW definitions and defaults.
  - Sell-side has no verticals in the spec, so the hub groups by four themes:
    YLD Yield, FIL Fill & Inventory, HB Header Bidding, DEAL Deals & Revenue Mix.
  - Revenue per Available Ad Slot is quoted per 1,000 slots (k = 1000) so the
    result is readable at 2 decimals instead of $0.00.
  - Header Bidding CPM Uplift uses ROI2 ((with HB − before) ÷ before × 100).
  - All counts (Home stats, hub intros, header search placeholder, meta
    description) come from COUNTS in src/lib/calculators/data.ts.
  - Both hubs share src/components/hub/HubPage.tsx; both calculator routes
    share CalculatorPage. Sell-side accent comes from src/app/sell-side/layout.tsx.
- Phase 4 (2026-10-30)
  - Creative specs live in src/data/creative-specs.json (52 units, 8 formats).
    Add a unit by appending to `specs`. `verify: true` marks platform- or
    publisher-specific specs; the UI shows a "Verify against current platform
    specs" badge on them. OWNER TO REVIEW before launch.
  - Governance copy is in src/app/governance/page.tsx (first draft, last
    reviewed October 2026, not legal advice). Platform-specific and regulatory
    statements carry a "Verify against current platform policy" badge.
  - Header search: index built on the server (src/lib/search-index.ts) and
    passed to the client header. Ranking in src/lib/search.ts: every query word
    must match; title > vertical/variable names > description. Max 5 results
    per group (Buy-Side, Sell-Side, Pages). ARIA combobox; "/" focuses search.
- Phase 5 (2026-10-30)
  - Media Planning (src/lib/planning/media-plan.ts): square-root diminishing
    returns per channel, calibrated so each channel hits its benchmark CAC/ROAS
    at an even split; suggested split ∝ (1/CAC)² or ROAS². Hand edits rebalance
    the other channels to keep the total. Channel benchmarks in
    src/lib/planning/channels.ts are ILLUSTRATIVE placeholders, editable in UI.
  - GTM Generator (src/lib/planning/gtm.ts): fixed rules per product type ×
    audience (not AI). Three phases (Seed / Scale / Convert), weeks 25/40/35%,
    max 4 channels per phase, channels trimmed when a phase can't give each
    ≥ $1,500. A test checks every KPI link resolves to a real calculator.
  - Media Mix Model (src/lib/mmm.ts, POST /api/mmm): power curve
    results = a·spend^b per channel via log-log least squares, b clamped to
    0.1–0.9, prior b = 0.5 when data is too thin; reallocation equalises
    marginal returns with moves capped at ±50%. Confidence (low / medium /
    reasonable) from periods, spend variation and R². Table layout: rows =
    channels, column pairs = periods (spend, results).
  - Mockup Studio: files stay in the browser (object URLs, nothing uploaded).
    Frames render at native CSS size and scale down; crop / letterbox % and
    resolution checks per placement (src/lib/mockup.ts).
- Phase 6 (2026-10-31)
  - Supabase via @supabase/ssr 0.12.7 + @supabase/supabase-js 2.117.3.
    Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ANON_KEY
    also accepted). With placeholders/missing values the site runs normally;
    login shows "not switched on", Save explains, nothing crashes.
  - Session refresh in src/proxy.ts (Next 16 renamed middleware -> proxy).
  - Google = provider "google"; Microsoft = provider "azure" with scope
    "email", tenant "common". Email = signInWithOtp: magic link (PKCE, lands on
    /auth/callback) or 6-digit code verified on the page. /auth/confirm also
    accepts token_hash links. Same-email linking relies on Supabase automatic
    identity linking (Azure needs the xms_edov claim) - see AUTH_SETUP.md.
  - Post-login `next` is validated by safeNext() (same-site paths only).
  - saved_items table + RLS in supabase/migrations/0001_saved_items.sql
    (kinds: calculator, media_plan, gtm_plan; 500 per user cap).
  - SaveBar handles save, ?saved=<id> reopen, and signed-out saves: work is
    stashed in sessionStorage, restored and auto-saved after login.
  - /saved lists items grouped by kind with Open and Delete (inline confirm).
- Phase 7 (2026-10-31)
  - Launch basics: NEXT_PUBLIC_SITE_URL (falls back to Vercel's production URL,
    placeholder ignored) -> metadataBase, Open Graph image (app/opengraph-image),
    sitemap.xml (84 public URLs), robots.txt (disallows /saved, /auth, /api).
  - Security headers in next.config.ts (nosniff, referrer policy, frame DENY,
    permissions policy); X-Powered-By removed.
  - Accessibility sweep with axe-core (WCAG 2.2 AA tags) on 18 page types at
    1440px and 360px, after interactions: 0 violations. Fixes: red text on the
    pink tint now uses dark red #A81820 (4.32:1 -> passes); no translucent text
    on red; mockup frame grays darkened; scrollable boxes keyboard-focusable;
    header search and number inputs show a visible focus ring.
  - Removed the unused Phase 1 ComingSoon placeholder component.
  - Docs: README.md (run, edit content, structure, pre-launch checklist),
    DEPLOY.md (GitHub Desktop + Vercel, domain, connecting login).
  - `npm run check` = type-check + tests.
- Design update (2026-10-31, owner request): glassmorphism with rounded
  corners. This SUPERSEDES the square/terminal styling in §5; palette, type,
  sell-side charcoal swap, motion and accessibility rules still apply.
  - Surfaces: `glass` (panels/cards), `glass-strong` (menus, popovers),
    `glass-ink` (dark cards) utilities in globals.css. Radii: panels
    rounded-3xl, cards rounded-2xl, inputs rounded-xl, buttons/chips/badges
    rounded-full, Home pillar cards 2rem, footer top 2.5rem.
  - Backdrop: fixed blurred colour fields (src/components/Backdrop.tsx), red on
    most pages, charcoal on sell-side; static under reduced motion. body is
    transparent so the backdrop shows; html paints the white.
  - Inputs keep a solid 2px ink border (form fields must stay clearly visible).
  - axe sweep after the change: 0 violations at 1440px and 360px.
- Creative Studio (2026-10-31, owner request; built from the "Ad Format
  Studio" prompt because the original ad-format-studio.html file was not
  available). Replaces Mockup Studio: route /creative-studio, permanent
  redirect from /mockup-studio, nav label "Creative Studio".
  - 52 formats in src/lib/studio/formats.ts across Display (13 IAB), Native,
    Social, YouTube, CTV, In-game, Mobile app, Audio, DOOH. Custom sizes and
    spec-CSV import (name, width, height, channel or a 300x250 column).
  - Delivery score 1–5 (src/lib/studio/score.ts): 1 = wrong media kind only;
    otherwise 5 minus penalties for crop (>3/15/35%), softness/stretch vs
    target pixel density, and duration outside the format's range; floor 2.
    Traffic-light chip colours always show the number (not colour alone).
  - Text layers (brand, headline, CTA) shared across formats; per-format
    position/size/visibility overrides; default sizes auto-fit the text.
    Overlays start hidden on placements whose platform UI already carries
    them (native, feed, story, player, TV, game).
  - Undo/redo (100 steps), click-again-to-type, drag, A−/A+, arrows to nudge,
    Delete to hide, Enter to edit. Shortcuts act only while the studio is in
    use, never while typing in site inputs.
  - Exports run in the browser: JPEG/PNG/WebP (canvas), HTML5 with clickTag
    and ad.size meta, VAST 4.2 (needs video), zip (JSZip 3.10.1, npm) with
    images, HTML5 folders, VAST + media, scores.csv. 150 KB display weight
    warning. Uploads limited to 20 MB; nothing leaves the device.
  - Site preview: templates (news, blog, shop, mobile), screenshot upload,
    live site in a sandboxed iframe (many sites refuse embedding).
  - No QR code (the original used qrcodejs for phone preview; there's no
    hosted preview URL to encode) and no dark mode (site has none).
  - Page hides the footer and stops page scroll at >=860px; panel stacks under
    the canvas below 860px.
  - Canvas made compact (owner: "canvas is too big"): formats larger than
    640px on their long side are drawn scaled to fit 640px (labels keep real
    sizes; exports stay full resolution; drags convert back to real pixels).
    Channel boards are shelf-packed three per row (src/lib/studio/boards.ts).
- Creative Studio replaced with the owner's original tool (2026-10-31): the
  owner supplied ad-format-studio.html. The React rebuild (src/lib/studio,
  src/components/studio) was removed in favour of the original, restyled:
  - Source kept at tools-src/ad-format-studio.original.html; the restyle is
    scripts/build-creative-studio.mjs -> public/tools/creative-studio.html
    (`npm run build:studio`). Every replacement must match exactly once.
  - Restyle: site tokens (red accent, ink text, glass bars/panels/menus,
    pill buttons, 10px inputs with ink borders), Inter / Sora / JetBrains Mono
    self-hosted in public/tools/fonts, dark-mode blocks removed (site has
    none), wordmark "Creative Studio" with the site mark. Score colours keep
    the red→green order, darkened (or dark text on amber/lime) for 4.5:1.
  - JSZip 3.10.1 and qrcodejs 1.0.0 self-hosted in public/tools/vendor.
  - Integration: same-origin iframe on /creative-studio (prompt's option 2).
    Chosen because the tool binds document/window listeners and styles
    body/html globally; in a client-routed Next.js app these would survive
    navigation. The frame isolates them and is torn down on navigation.
    X-Frame-Options changed DENY -> SAMEORIGIN to allow it.
- Creative Studio v2 additions (2026-10-31): the owner asked for the IAB
  Transition Guide 2017 and IAB DV & CTV Ad Format Guidelines 2022 additions
  to be built directly into tools-src/ad-format-studio.original.html (no newer
  upstream file was supplied). Additions only; 52 -> 75 formats:
  - New channels "IAB Flexible" (Flex 1x1, 6x1, 4x1, 1x3, 8x1, 9x16; weights
    from iabGrid; responsive HTML5 via shellFlex) and "In-stream video"
    (linear 16:9 / 4:3 / 21:9, bumper 3–10s, :60, infomercial, overlays
    300×50 / 450×50, companions 300×250 / 728×90 / 300×60 / 300×100 /
    468×60); new CTV :06, :60, 21:9 and picture-in-picture (L-shape).
  - New behaviour is attached only to formats with v2:true: v2Checks /
    videoFileChecks / audioFileChecks (duration ±1s, H.264 profile/level,
    fps, bitrate bands, MOOV position, AAC-LC, loudness US/EU, peak ≤ −6 dB,
    black leader, burned-in bars, CTV mezzanine). The old VAST builder is
    now buildVASTv1; buildVAST sends v1 formats to it unchanged and v2 ones
    to the renditions + mezzanine + companions builder or buildNonLinear.
    encodeGuide writes the ffmpeg commands for the exact files the tag names.
  - File inspection (File.slice MP4 box parser, OfflineAudioContext BS.1770
    loudness, canvas frame sampling), US/EU switch in the Creative menu,
    Universal Ad ID in the Export menu, new preview slot options (Overlay
    starts at None). Everything stays in the browser.
  - Build: every "Ad Format Studio" in the source (VAST AdSystem, encoding
    comments, zip README) is renamed to "Creative Studio" by
    scripts/build-creative-studio.mjs (previously the AdSystem read
    "thedigitalwit Creative Studio").
  - Verified: the 52 existing formats are identical to the previous build
    (definitions, scores with sample/image/video/audio, HTML5 markup, JPEG
    bytes, 15 VAST tags), plus the owner's test list on the live page.
- DoohSight added (2026-10-31): DOOH / pDOOH measurement dashboard at
  /doohsight, listed under Tools. The owner's prompt described a standalone
  doohsight.html; no file was supplied, so it was built natively (owner had
  asked for that approach with Creative Studio):
  - Logic: src/lib/doohsight.ts (pure, unit-tested). Seven scored layers
    (delivery, attention, footfall, halo, business, brand, incrementality)
    with fixed weights and full-marks benchmarks, a trust check grid that
    caps the score (critical -> 60, quality < 70 -> 75), two-proportion
    z-tests for brand lift and the holdout test.
  - UI: src/components/tools/DoohSight.tsx. Ten tabs (Overview, seven layers,
    Trust & Quality, Methodology), sticky score bar under the site header,
    HTML bar charts with a cursor-following tooltip and value labels.
  - Layer colours: the dataviz skill's validated categorical slots 1–7
    (CVD check passes; three sit under 3:1 on white, so every bar carries a
    visible value label). No dark mode, matching the site.
  - Sample: fictional "Meridian Coffee Co. · Autumn Roast Launch", fully
    editable; edits persist in localStorage key `doohsight-state`, cleared by
    Reset sample. No account saving (would need a new saved_items kind).
  - Data in (2026-11-01, owner asked how the numbers get in and to automate
    what can be): new Data Sources tab (11 tabs now) and an "Import data"
    button in the score bar.
    - Upload: src/lib/doohsight-data.ts reads CSV/TSV/JSON in the browser
      (nothing uploaded to a server) and recognises four layouts: summary
      template (field,value; also the exported CSV and DoohSight's own JSON),
      proof-of-play log (screens, plays, impressions, spend, PoP match,
      screen-day uptime, weeks), weekly before/during channel data (halo
      inputs), and exposed/control row-level files (holdout, footfall, brand
      lift). Every change is shown for review before it's applied. Excel files
      get a "save as CSV" message (no spreadsheet package added).
    - Market: /api/doohsight-market (free, keyless): Wikidata population for a
      city/region/country (preferred, then latest, figure; the user picks the
      match) and Google Trends branded-search index before vs during the
      flight. Trends is an index, so the halo tile says to read the lift %.
    - No free public source exists for reach, attention, footfall panels,
      verification, category spend, market share or CPM benchmarks; the
      "Where every input comes from" table names who provides each one.
    - Each field records where its number came from (file name, Wikidata,
      Google Trends); typing clears it. Saved as v2 in `doohsight-state`.
- Media Plan Generator added (2026-10-31) at /media-plan-generator, listed
  under Strategy. Built natively from the owner's prompt (no reference HTML
  was supplied). Separate from /media-planning (CAC/ROAS splitter).
  - Data: src/lib/mediaPlan/{types,constants,format,grading,plan}.ts, no
    React; plan.ts holds impressions/reach/pacing/week conversion so they
    are unit-tested (mediaPlan.test.ts).
  - UI: src/components/media-plan/* (state only in MediaPlanGenerator).
    Charts use recharts 3.10.1 (new dependency, with react-is 19.3.1).
  - The brief says 30 currencies and 39 countries but lists 31 and 35; the
    lists were kept exactly as written.
  - Layout rules from the brief: no sticky/fixed, no negative margins, no
    viewport heights. Default dates are set after hydration (today + 14,
    + 56 days) so server and client markup match.
  - Grade colours and channel colours kept as specified; the grade letter
    is ink on a coloured ring (lime/amber text would fail contrast on white).
- Contextual Signal Generator added (2026-10-31) at /contextual-signal, listed
  under Tools. Built natively from the owner's prompt (the referenced
  ContextualSignalGenerator.jsx and route.js were not supplied).
  - API: src/app/api/context/route.ts (runtime nodejs). Free, keyless sources:
    GDELT (news), Reddit + Hacker News (social), Google Trends via
    google-trends-api 4.9.2; sentiment 5.0.2 for local lexicon scoring.
    8 s per-source timeout; GDELT calls spaced 5.2 s apart per instance with
    one retry on 429/5xx; 10-minute in-memory cache (2 minutes for partial
    results), 500 entries max; 20 requests/minute/IP; CDN Cache-Control on
    complete answers. Excluded from the auth proxy matcher.
  - Social posts are kept only if they name every word of the keyword:
    Hacker News search also matches comments, and 12 of 20 hits for
    "binance" didn't mention it.
  - UI: src/components/tools/ContextualSignal.tsx. No lucide-react (inline
    glyphs instead), so the only new UI dependency is recharts (already in).
  - Observed during testing from this Mac: Reddit blocked (403) every time;
    GDELT answered once, then rate-limited (429 after ~12 s) for the rest of
    the session; Hacker News and Google Trends answered every time.
  - Fix (2026-10-31, owner approved the new sources): News and Social were
    empty because GDELT kept rate-limiting and Reddit's JSON returned 403.
    News now merges GDELT + Google News RSS + Bing News RSS (en-US),
    de-duplicated by title; Social merges Reddit (search.rss, posts only) +
    Hacker News + Bluesky public search (api.bsky.app, lang=en). A section is
    unavailable only when all of its sources fail. GDELT is skipped for 2
    minutes after a failure so searches aren't held by its 8 s timeout.
    RSS/Atom are read with small tested helpers (no XML package).
  - Related keywords section (2026-10-31, owner approved Google search
    suggestions as a source): its own section below Search interest with
    Trends related + rising searches and suggestqueries.google.com
    (client=firefox, en/us) autocomplete + "keyword vs" comparisons. Response
    gains `keywords`; `unavailable` can include "keywords". Every keyword
    chip runs a new search. 502 only when all four sections fail.
- GTM Generator replaced (2026-10-31, owner's choice) by a full GTM strategy
  generator built from the "GTM Signal" prompt (gtm-strategy-tool.jsx was not
  supplied, so the content was written natively). Same route /gtm-generator
  and name. Old launch planner removed (src/lib/planning/gtm.ts + test).
  - Data: src/lib/gtm/data.ts (10 industries, 9 geographies, 4 goals,
    3 stages, 4 budget bands, 8 channels with example stacks, local stacks
    for Greater China, Japan/Korea, MENA, India, SEA, LATAM). No market-size
    figures anywhere (a unit test guards this).
  - Logic: src/lib/gtm/build.ts (channel mix to exactly 100%, scorecard,
    26-week timeline with go/no-go gates, risk register, compliance,
    narrative, governance), tested across all 4,320 combinations.
  - UI: src/components/tools/GtmGenerator.tsx. Three tabs, Print / Save as
    PDF renders all three (print styles in globals.css under .gtm-root). No
    network, no storage. Saved items: old "GTM plans" only listed while some
    exist, with a note they can't be reopened.
- 2026-11-01: owner asked for clearer "needs input" marking, a GTM geography
  benchmark, a bootstrapped company stage, and natural-language input on every
  tool and calculator ("Claude AI + fallback", "Every tool and calculator").
  - DoohSight: a field still holding the fictional sample shows a "Sample" tag;
    each tab shows how many are left, each Inputs panel says "n of m still
    sample values", and the Overview has a progress card linking to the tabs.
    Typing records "Typed in" as the source.
  - GTM Generator: new stage "Bootstrapped (self-funded, standalone)" (owned
    channels weighted up, CTV/events/programmatic down, High cash-flow risk,
    budget fit like a startup). Stages now carry `fit` and optional `shift`.
    New "Market Benchmark" tab: the same plan in all 9 geographies, ranked by
    entry score (average of the scorecard), with FX, in-market lead, first
    gate week, High risks and lead channels; "Plan for this market" switches.
    No market-size figures. Privacy pill now "Built in your browser · nothing
    stored" because the describe box can call the AI route.
  - Natural language: src/lib/ai/fill.ts (spec format, built-in reader,
    answer checking), src/lib/ai/specs.ts (one spec per tool, calculators
    generated from their vars), src/lib/ai/registry.ts (server lookup; the
    route accepts only these ids), /api/ai-fill (Claude via @anthropic-ai/sdk
    1.3.0, structured JSON output of field/value pairs, effort low, server-side
    refusal fallback, 10 requests/min/IP, 1,500-character limit),
    components/ai/DescribeBox.tsx. Without ANTHROPIC_API_KEY (or on any AI
    error) the browser's built-in reader fills what it can and says so.
    Calculators: the "Natural Language AI" tab is now live.
- MixLens added (2026-11-01) at /mixlens, listed under Tools, from the owner's
  "vscode-prompt_add-mixlens.md". The prompt assumed a mixlens-standalone.html
  that was never supplied, so it was built natively (as with Creative Studio).
  The existing /media-mix-model (quick power-curve fit) stays alongside it.
  - Engine: src/lib/mixlens/engine.ts. Geometric adstock + Hill saturation per
    channel (θ, K, shape chosen by coordinate search from four starts; S-shaped
    curves pay an AIC-style penalty), linear part by least squares with a ridge
    scaled to each column's variation and non-negative media effects; trend,
    52-week Fourier seasonality and control columns in the baseline. Holdout:
    last N weeks (default 13) fitted blind. Ranges: moving-block (4-week)
    residual bootstrap, each draw re-searching carryover/K/shape near the best
    fit (80/200/400 draws for Quick/Standard/Thorough). Runs in the browser in
    about 0.5–2 s and yields so the progress bar animates.
  - Data: src/lib/mixlens/data.ts (CSV/TSV/paste via the shared parser, role
    guessing, daily → weekly, checks with plain-language errors, template and
    results CSV). Sample: src/lib/mixlens/sample.ts, "Halden Home (sample)",
    104 weeks, 6 channels, 2 controls, generated from known true values
    (seed 20261213, chosen from 30 seeds as the best-behaved demo; 5 of 6 true
    ROAS inside the 90% ranges). Methodology shows true vs estimated.
  - Findings: src/lib/mixlens/insights.ts (break-even from margin or target
    CPA, action per channel from marginal return vs break-even, headline,
    insights). UI: src/components/mixlens/* — 8 hash-addressed tabs, sticky
    bar under the site header, hand-drawn SVG charts with Expand (portal,
    z 70; tooltip 80; toast 90; html.fs-lock in globals.css), zoom buttons and
    drag-zoom shared by Summary and Model accuracy, chart-style switches.
  - Storage keys: mixlens-settings-v1, mixlens-scenarios-v1,
    mixlens-scen-pct-v1, mixlens-view-v1. Uploaded data itself isn't stored.
  - Prompt steps not applicable here: no GTM/dataLayer and no CSP on this site,
    so no analytics events or CSP changes; no dark mode on the site; no
    call-to-action (no contact page yet). Excel upload and long-format files
    are the prompt's optional follow-ups, not built yet.
- 2026-11-01: owner merged overlapping tools. "Media mix model and MixLens is
  same; media planning and media plan generator is same, only ROAS and CAC is
  not there in media plan generator."
  - Media Mix Model (/media-mix-model) is now the full model built as MixLens:
    code moved to src/lib/mmm/ and src/components/mmm/ (MediaMixModel),
    storage keys renamed mmm-*-v1 (not yet live, so nothing to migrate). The
    old power-curve tool, src/lib/mmm.ts and /api/mmm were removed. Its
    "Describe your case" box now sets the model's settings (KPI type,
    currency, margin, target cost per conversion, holdout, detail).
  - Media Plan Generator gained "Performance targets": target CAC or ROAS,
    editable per-channel assumptions (USD internally, shown in the plan's
    currency), blended result vs target, results per channel, and "Optimise
    split" (src/lib/mediaPlan/performance.ts on the existing model in
    src/lib/planning/media-plan.ts). The summary table and JSON export
    include them. Saving moved here (kind media_plan); plans saved by Media
    Planning still open (old payload mapped onto the generator). Media
    Planning's search, retail media and affiliate channels have no
    equivalent among the generator's seven channels and were dropped.
  - Removed pages /media-planning and /mixlens, with permanent redirects to
    /media-plan-generator and /media-mix-model (next.config.ts).
- 2026-11-01: Creative Specs merged into Creative Studio at the owner's
  request ("merge creative specs and creative studio in one and mention as
  creative studio"). /creative-studio has two tabs, "Preview & export" (the
  framed app, kept loaded) and "Specs library" (#specs). The viewport lock and
  hidden footer (.studio-root) apply only on the preview tab. /creative-specs
  was removed and permanently redirects to /creative-studio#specs; the menu
  lists Creative Studio only.
- 2026-11-01: contact details removed from the footer at the owner's request
  ("remove contact details for the footer"); SITE.contact deleted from
  src/lib/site.ts. The footer is now brand + tagline and the link columns.
