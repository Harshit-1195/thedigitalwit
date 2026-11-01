# thedigitalwit

A free, self-serve reference hub for digital advertising: 75 KPI calculators (63
buy-side across 13 verticals, 12 sell-side), a Media Mix Model, GTM Generator,
Media Plan Generator (with CAC/ROAS targets), DoohSight, Contextual Signal, Creative Studio (50+ ad formats with scores and export, plus the creative specs library) and a Governance guide.
Nobody needs an account to use anything; logging in only unlocks saving.

Built with Next.js 16 (App Router, TypeScript), Tailwind CSS 4 and Supabase.

| Document | What it's for |
|---|---|
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | The product brief and a log of every build decision |
| [AUTH_SETUP.md](AUTH_SETUP.md) | Switching on login: Supabase, Google, Microsoft and email |
| [DEPLOY.md](DEPLOY.md) | Putting the site on the internet, step by step |

---

## Run it on your computer

**One-time setup**

1. Node.js 20.9 or newer is required. On this Mac it's already installed in
   `~/.local/node`. Make it available in every Terminal window by running this
   once, then opening a new Terminal window:
   ```
   echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc
   ```
   On another computer, install the "LTS" version from **nodejs.org** instead.
2. Install the project's dependencies:
   ```
   cd ~/thedigitalwit
   npm install
   ```
3. Optional, only for login and saving: copy `.env.example` to `.env.local` and
   fill it in (see [AUTH_SETUP.md](AUTH_SETUP.md)). Without it, everything except
   saving works.
4. Optional, for the AI in the "Describe your case" boxes: add `ANTHROPIC_API_KEY`
   to `.env.local` (key from console.anthropic.com → API Keys; Anthropic bills per
   request). Without it the boxes still work with a simpler built-in reader.

**Every day**

| Command | What it does |
|---|---|
| `npm run dev` | Starts the site at http://localhost:3000 and reloads as you edit. Stop it with Ctrl+C. |
| `npm test` | Runs the automated tests (calculator engine, data files, search, planning models, login helpers). |
| `npm run check` | Type-checks the code, then runs the tests. Run it before publishing changes. |
| `npm run build` then `npm start` | Builds and runs the production version locally, exactly as the live site runs. |

---

## Changing content

Most content lives in plain data files, so you rarely need to touch the page code.
After any change, run `npm run check`: the tests catch most mistakes (for
example, a calculator whose numbers don't solve in every direction).

| To change… | Edit |
|---|---|
| Buy-side calculators | `src/data/buyside-calculators.json` |
| Sell-side calculators | `src/data/sellside-calculators.json` |
| Vertical / category names and order | `src/lib/calculators/data.ts` (`BUY_CATEGORIES`, `SELL_CATEGORIES`) |
| Creative specs | `src/data/creative-specs.json` (add an object to `specs`) |
| KPI one-liners in the Home marquee | `src/content/one-liners.ts` |
| Governance page text | `src/app/governance/page.tsx` |
| Menu items and page descriptions | `src/lib/site.ts` (`NAV_GROUPS`) |
| Colours and fonts | `src/app/globals.css` (top of file) |
| GTM Generator playbooks | `src/lib/planning/gtm.ts` |
| Media Plan Generator CAC/ROAS channel assumptions | `src/lib/mediaPlan/performance.ts` (`DEFAULT_ASSUMPTIONS`) |
| DoohSight sample campaign, scoring weights and benchmarks | `src/lib/doohsight.ts` (`SAMPLE`, `WEIGHTS`, `FULL_MARKS`) |
| DoohSight upload layouts, column names and "who provides it" notes | `src/lib/doohsight-data.ts` (`FIELDS`, `LAYOUTS`) |
| Words the "Describe your case" reader understands, per tool | `src/lib/ai/specs.ts` |
| Media Mix Model sample campaign, model grid and defaults | `src/lib/mmm/sample.ts`, `engine.ts` (`THETAS`, `K_MULTS`), `insights.ts` (`DEFAULT_SETTINGS`) |
| Media Plan Generator channels, CPMs, currencies, markets, grading | `src/lib/mediaPlan/constants.ts` and `grading.ts` |
| Contextual Signal sources, timeouts, cache and rate limit | `src/app/api/context/route.ts` |
| Creative Studio (formats, scoring, templates) | Edit `tools-src/ad-format-studio.original.html`, then run `npm run build:studio`. It already includes the IAB Flexible, In-stream video and new CTV additions; if you replace it with a newer file, make sure that file has them too |
| Creative Studio colours and styling | `scripts/build-creative-studio.mjs` (the restyle applied on top of the original) |

**Adding a calculator:** copy an existing entry in the JSON file, give it a new
unique `id` (lowercase-with-dashes, used in its web address), set `cat` to a
vertical code, and pick one of the five `relation` types described in
PROJECT_SPEC.md §4. The **last** variable is the named output. Its page, hub card,
search entry, sitemap entry and the Home page counts all update automatically.

---

## How it's organised

```
src/
  app/                  One folder per page (the folder name is the web address)
    buy-side/  sell-side/   Hubs + the shared calculator page template
    auth/                   Where Google, Microsoft and email sign-in return to
  components/           Building blocks (header, calculator panel, tools, login)
  data/                 Calculator and creative-spec data files (JSON)
  lib/
    calculators/        The solver, field logic, formatting, explanation text
    planning/           CAC/ROAS model used by the Media Plan Generator
    mediaPlan/          Media Plan Generator data, grading and CAC/ROAS targets
    mmm/                Media Mix Model: engine, data import, sample, findings (runs in the browser)
    supabase/  auth/    Login plumbing
  proxy.ts              Keeps the login session fresh on each request
supabase/migrations/    Database setup for "My saved items"
```

Every `*.test.ts` file next to the code is an automated test.

---

## Before launch: content to review

These were drafted during the build and are clearly marked in the site:

- [ ] **All 75 calculators** (names, definitions, example numbers) were written by the builder. The maths is tested; the wording is worth an expert read.
- [ ] **Sell-side groupings** (Yield, Fill & Inventory, Header Bidding, Deals & Revenue Mix).
- [ ] **Creative specs** marked "verify" are platform-specific; confirm against current spec sheets.
- [ ] **Governance page** is a first draft, not legal advice; platform and regulatory items are flagged "verify".
- [ ] **Media Plan Generator CAC/ROAS assumptions** are illustrative placeholders (the page says so).
- [ ] **GTM playbooks** (channels and KPIs per product type) reflect general practice.
