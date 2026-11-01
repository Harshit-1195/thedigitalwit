# Design prompt: thedigitalwit

Paste this into an AI tool (or hand it to a designer) when creating a new page,
so it matches the rest of the site.

---

Design a page for **thedigitalwit**, a free reference hub for digital advertising
(KPI calculators and media tools). Style: **bold red-and-white editorial type on
frosted glass**. Confident and witty, never playful or pastel.

**Colour**
- White `#FFFFFF` page, near-black `#111111` text, muted `#555555` for secondary text.
- Red `#D8232A` for buttons, links, highlights; dark red `#A81820` for hover and for
  red text on light-pink backgrounds; light pink `#FDEAEA` for soft fills.
- Sell-side (publisher) pages swap red for charcoal `#1A1A1A`. No other colour families.

**Type**
- Headings: Sora, extra-bold, very tight letter-spacing (about −0.05em), huge
  (up to ~7rem). Often two lines, with the last word in red.
- Body: Inter. Small uppercase "eyebrow" labels with wide letter-spacing sit above headings.
- JetBrains Mono only for numbers in calculators and for formulas.

**Surfaces (glassmorphism)**
- Panels and cards: translucent white (about 60% opacity), 20px background blur,
  a 1px white inner edge, a faint dark hairline and a soft shadow.
- Corners: panels 24px, cards 16px, inputs 12px. Buttons, chips and badges are full pills.
- Behind everything: a few large, slowly drifting, heavily blurred red shapes
  (charcoal on sell-side pages) so the glass has colour to blur.
- Menus and popovers use denser glass (about 85% white) so small text stays crisp.
- Dark cards use smoky black glass with white text.

**Components**
- Primary button: solid red pill with white text; hover is dark red.
- Secondary button: glass pill with dark text.
- Inputs: rounded, a solid 2px dark border (always clearly visible), light translucent fill.
- Filters: a row of pill chips; the active chip is solid red.
- Sticky glass header and sticky glass filter bars.
- Numbered lists (01, 02, 03) instead of icon grids.

**Layout**
- Left-aligned page intros: eyebrow, then giant headline, with a short intro paragraph beside or below.
- Generous whitespace and strong grid alignment. No stock photos or decorative illustrations.

**Motion and access**
- Subtle scroll reveals and slow background drift. Everything static when the user
  prefers reduced motion.
- WCAG AA contrast, a visible red focus ring on every interactive element,
  keyboard-operable, and it works down to 360px wide.

**Voice:** short, sharp, a little witty (e.g. "CPM: what you pay to be seen, not clicked.").
