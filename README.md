# Model Radar

A single-page static tracker for frontier AI models: who shipped what, how it scores, what it
costs, and which model it replaces. Open-weights and proprietary models are tracked as two
separate frontiers, and every section can be scoped to either side.

Built with Vite + React + TypeScript + Tailwind v4. Fully static — `npm run build` emits `dist/`
and every model record is bundled, so it works from any static host. The one live piece is the
"Live wire" panel, which fetches OpenRouter's public model catalogue in the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + static export to dist/
npm run preview    # serve dist/
```

Check types on their own with `npx tsc -b`.

Scope and chart view are shareable links: `?scope=open`, `?scope=closed`,
`?view=split`, `?view=price`, `?view=mix` (combinable). They are written back with
`replaceState` as you switch.

## What's on the page

0. **Scope switch** — `All 80 / Open 35 / Closed 45`, in the header on desktop and above the
   headline on mobile. It filters the hero, the chart, the drops, lineage families, labs, the table
   and the live wire. Everything responds to the same state.
1. **Hero** — leader *within the current scope*, the other side's leader for comparison, newest
   release, 30-day count. The headline changes with scope ("The open frontier, on one map").
2. **The frontier** — four views of the same set:
   - *Time*: every scored release as a dot (release date × AA Intelligence Index v5) with the
     best-score-so-far envelope line. Scoped, the envelope becomes the open (or closed) frontier.
   - *Price*: output price (log scale) × score, so the efficient corner is obvious.
   - *Mix*: benchmark matrix — overall, coding, agentic, knowledge — heat-scaled per column.
   - *Split*: both frontiers on one axis, with the current gap bracketed at the right edge
     (proprietary 64.6 vs open 46.5 = 18.1 points).
3. **Latest drops** — newest eight releases *in scope* with price, context and what changed.
4. **Lineage** — pick a family, see each generation, with the score delta on every arrow.
5. **Labs** — company profiles: best score in scope, latest release, and a bar showing how much of
   each lab's output is downloadable.
6. **Every model** — searchable, sortable table (score, sub-scores, context, price, weights,
   parent). With scope on All, it is grouped into two bands — **OPEN WEIGHTS** and
   **PROPRIETARY** — each with its own count and best score; the toggle turns grouping off.
7. **Live wire** — OpenRouter's catalogue, newest first, with API slugs. Fetched on load and
   re-polled every 10 minutes while the tab is visible; the pill in the section header counts down
   the next poll and doubles as a pause control. Follows the scope: Open shows only entries with a
   Hugging Face repo listed, Closed only those without. The header badge (`WIRE LIVE` / `WIRE · N
   NEW`) turns into a count when the catalogue has an arrival newer than the snapshot date.

Clicking any dot, row, card, chain node or lab opens the same detail drawer: score and rank,
benchmark breakdown, specs, the lab profile, the parent chain, successors, and what changed.

## How fresh is the data?

Two different clocks, deliberately:

- **The scored board is a dated snapshot.** `models.ts` is bundled at build time, so scores,
  lineage, prices and the curated notes change only when that file changes and the site is rebuilt.
  The page labels the date (`SNAPSHOT_DATE`, `SCORE_AS_OF`) so it never pretends otherwise. This is
  the part that needs a human: AA scores land days after a launch, and `parent` links require
  reading the release notes.
- **The live wire is polled.** `useLiveModels` fetches `openrouter.ai/api/v1/models` on load and
  every 10 minutes while the tab is visible (skipped when hidden, caught up on return, pausable
  from the pill). That catalogue has no ETag and weighs ~930 KB, and its CDN cache is 120 s, so a
  poll is a full download — hence ten minutes rather than thirty seconds. A failed poll keeps the
  last good rows and retries; a cold failure falls back to the `localStorage` copy from the previous
  visit.

So a model that appears on OpenRouter today shows up in the wire within ten minutes of opening the
page, with its price, context and API id — but it enters the chart, table and lineage only after the
snapshot is updated. `?live=<seconds>` overrides the poll interval (10–3600) for testing.

## Open weights vs proprietary

`weights` in `src/data/models.ts` is one of:

- **`open`** — weights are downloadable under an open or source-available licence (Kimi, DeepSeek,
  Qwen 27B, GLM, Granite, gpt-oss…).
- **`gated`** — weights are downloadable but access or commercial terms are restricted (Muse Spark
  Open).
- **`closed`** — API only, no public weights.

The Open scope is `open + gated`, because both let you run the model yourself; it is labelled
"open weights" rather than "open source" because licences vary (MIT, Apache 2.0, modified MIT,
bespoke). The split is in `src/lib/scope.ts` — `inScope()` is the only filter every component
calls, so changing the definition is a one-line edit.

## Where the numbers come from

| Field | Source |
| --- | --- |
| `aa`, `aaConfig` | Artificial Analysis Intelligence Index v5, best published configuration (`SCORE_AS_OF` in `src/data/models.ts`) |
| `bench.coding / agentic / knowledge` | BenchLM's published top-10 boards — only the models that made a board have sub-scores |
| `released`, lineage, release notes | Each lab's own release log, cross-checked with The Durability Curve (CC BY 4.0) |
| `priceIn / priceOut`, `contextK`, `weights` | Vendor pages / model cards as reported by the trackers above |
| Live wire | `https://openrouter.ai/api/v1/models` (no key, CORS-open) |

Scores are the **best evaluated configuration** (usually max reasoning effort), so treat the top
line as generous. A blank score means no independent eval has been published — not that the model
is weak. Prices are list prices on the snapshot date; introductory pricing is called out in each
model's note.

## Updating the snapshot

Everything curated lives in `src/data/`:

- `models.ts` — one object per model. Required: `id`, `name`, `vendor`, `family`, `released`,
  `status`, `contextK`, `weights`, `note`. Optional but valuable: `parent` (id of the previous
  model in the line), `aa` + `aaConfig`, `bench`, `priceIn`/`priceOut` in $/1M, `params`,
  `modalities`, `license`, `source`.
- `vendors.ts` — lab name, HQ, one-paragraph profile, and the chart colour.

To add a release: append the object, set `parent` to the model it supersedes, and bump
`SNAPSHOT_DATE` / `SCORE_AS_OF` if you are refreshing the whole board. Lineage chains, family
chips, leader stats, the lab grid and every chart are derived at runtime — no other file needs
touching.

The live wire needs no maintenance; it reads the catalogue on each visit and caches the last
payload in `localStorage` for the refused/offline case.

### Finding a new release (no key)

```bash
npm run whats-new                    # last 21 days, everything not in models.ts
npm run whats-new -- --days=45 --limit=40
npm run whats-new -- --draft          # paste-ready TypeScript skeletons
```

Same public OpenRouter endpoint the live wire uses — no key, no scraping, no account. It skips
OpenRouter's auto-routers and `:free`/`:batch` variants, then prints the listings that are missing
from the snapshot with their date, context, price and API id. `--draft` emits an object you can
paste into `models.ts`; fill `family`, `parent` and `note` (that's the judgment call the catalogue
can't make), then build.

Scores are not in the catalogue, so they stay as curated until an eval is published; the live wire
is what tells you a release exists in the first place.

## Structure

```
src/
  data/models.ts          curated snapshot (80 models)
  data/vendors.ts         27 lab profiles + colours
  lib/derive.ts           rankings, lineage walking, formatting, stats
  lib/scope.ts            the open / closed split and per-scope stats
  hooks/useLiveModels.ts  OpenRouter fetch, poll, cache
  scripts/whats-new.mjs   keyless diff of the catalogue against the snapshot
  components/             Header, Hero, ScopeSwitch, FrontierPanel (4 charts),
                          LatestDrops, LineagePanel, LabGrid, ModelsTable,
                          LiveWire, DetailDrawer, Footer, ui
```

No chart library: the scatter plots, envelope, heat matrix and lineage connectors are hand-rolled
SVG/CSS, which keeps the bundle at ~96 kB gzipped.
