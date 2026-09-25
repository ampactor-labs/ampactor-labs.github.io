# Ampactor Labs — Design System

**One canonical reference for the brand, the visual language, the components, and the
voice.** Read it before touching any UI in this repo; hand it to a designer or an AI
design tool as the brand context.

- **Token source of truth:** `public/tokens.css` (auto-generated from the upstream
  `ampactor-theme` repo — `tokens/*.yaml` → `export/to-css.sh`). _Never hand-edit
  `tokens.css`; change the YAML upstream and rebuild._ The app's semantic layer on top of
  it is `src/styles/theme.css`.
- **Copy source of truth:** `src/data/profile.js` (identity, contact), `src/data/site.js`
  (every page's `<head>` and the one line of range), `src/data/projects.js` (the work,
  with content fields pulled from each project's README at build time) and
  `src/data/resume.json` (the résumé, rendered to `public/resume.html` and drawn as the
  timeline). Nothing is mirrored by hand any more.
- **This doc** is the layer the tokens and code don't carry: the concept, the usage
  rules, the component vocabulary, and the voice.

---

## 1 · Concept

**"Patina Dark" — a worn arcade CRT, rendered with systems-engineer precision.**

The site is one room with one machine in it. The **floor** is the room: a calm,
readable page in the cabinet's own light, where the name, the line of range, the work,
the way of working and the years are laid out to be read in under a minute. The
**cabinet** stands in the room, running its attract loop. Walk up to it (click, Enter)
and the camera dollies in: the same machine fills the screen, the tube fires, and the
arcade is the arcade it always was — cartridges, coin slot, hidden programs. Step back
(Escape, B, `‹ FLOOR`, the browser's Back) and it shrinks to where it stood.

One universe, two depths. There is no "second portfolio": the console on the floor is
the console in the arcade, laid out at its full size and scaled into its slot. The
aesthetic is not nostalgia for its own sake — it is **proof of craft**: every effect is
hand-built (GSAP, canvas, a Web Audio synth), and the floor around it is the product
UI the same hands make.

| Surface | Role | Feel |
|---|---|---|
| **Floor** (`src/floor/`, `src/App.tsx`) | The room. Fast, skimmable, readable in ~60 s. Light or dark. | Same palette, the tube's glow pooling on the floor; prose in a reading face; signage in the arcade face, tiny. |
| **Cabinet** (`src/arcade/`) | The machine. Opt-in depth: attract loop on the floor, cinematic boot when zoomed, cartridge select, readouts, hidden games. | Full CRT theatre: heavy glow, scanlines, ambient audio once entered. Always dark. |

The floor converts; the cabinet rewards. Design changes to one must not flatten the
other. **The floor is where design exploration belongs.** The cabinet is bespoke craft;
don't let a generator re-skin it.

---

## 2 · Voice

**Confident, concrete, plain-spoken. Receipts over claims.**

- **No title, one line of range.** The name is followed by what gets made, not a job
  title or an industry: _"Compilers, synths, games, and the apps around them. Shipped,
  with receipts."_ The site never pins its author to front-end, back-end, or a sector.
- **Lead with the outcome a non-engineer can map to money or risk**, then back it with
  the hard number one layer deeper (the cabinet readout).
- **Publish the losses.** Benchmarks show where they lose; READMEs carry a _Weak spots_
  section; cards are generated from those READMEs so a claim cannot outrun its repo.
- **Terse, technical, lower-case-comfortable.** Mono fonts for readouts, `→` arrows,
  `·` separators, `●` status dots. No marketing adjectives. Let the artifacts carry it.
- **Own the story as a story**: six years employed full-stack, then a studio. Rendered
  as a timeline, not explained.

**Copy registers, by depth:**

1. `range` (site.js) and `outcome` (projects.js) — floor, one plain sentence.
2. `tagline` — the arcade hook, ALL-CAPS, punchy.
3. `desc` / `highlights` / `operatorNote` — the engineer's proof, in the cabinet.

---

## 3 · Color

> **Naming caution:** the hero accent is **electric cyan `#00E5FF`** (`--color-cyan`).
> The muted **patina teal `#7daea3`** (`--color-teal`) is a different colour used as a
> syntax/role colour. "The cyan / the glow" always means `#00E5FF`.

### Core palette (Patina Dark)

| Token | Hex | Role |
|---|---|---|
| `--color-cyan` | `#00E5FF` | **Hero accent.** Glow, the active item, the cabinet's signage. Spend it like a spotlight. |
| `--accent-text` | cyan / `#00708a` | The accent **as text on the page background**. Cyan in the dark theme; deepened in the light theme, where electric cyan has no contrast on parchment. Use this, not `--color-cyan`, for links, eyebrows, CTAs and the focus ring on the floor. |
| `--color-amber` | `#d8a657` | Secondary accent: employment bars, INSERT COIN, caution. |
| `--bg` / `--color-charcoal` | `#1d2021` | Page background (top of the radial). |
| `--color-dim` | `#2a2826` | Mid background, the cabinet's chassis. |
| `--color-void` | `#0f0e0d` | Deepest background, insets. |
| `--fg` / `--color-parchment` | `#d4be98` | **Primary text.** Warm parchment, never white. |
| `--fg-bright` | `#efe4cc` | Headlines, one step brighter than body. |
| `--fg-muted` / `--fg-faint` | `#a89984` / `#9a8e81` (light `#665a50` / `#6b5f54`) | Secondary and tertiary **text**. Both clear 4.5:1 on every surface the page paints in either theme; the palette's own `--color-muted` / `--color-comment` stay for fills and `color-mix` recipes, never for text. |
| `--chart-1` | `#22c3dc` (light `#00708a`) | The one hue for magnitude in a chart: commits per month, commits by repository, the floor's strip. Validated with the dataviz palette checker against each theme's chart surface. |
| `--chart-pos` / `--chart-neg` | `#3aa886` / `#e26a62` (light `#0a8f9c` / `#c14a4a`) | The diverging pair: lines added above the baseline, lines removed below it. The dark pair sits in the colour-blind floor band (ΔE 6.7), so sign is always also carried by position, a legend and direct labels. Text in a chart wears text tokens, never a series colour. |
| `--hairline`, `-strong`, `-faint` | `color-mix` of `--fg` | Borders and rules; derived, so right in both themes. |
| `--surface`, `--surface-raised` | `color-mix` of `--fg` | Card fills. |

### Per-project colour

Each project owns one neon in `projects.js`. In the **cabinet** it is used raw. On the
**floor** it is muted toward the patina — `color-mix(in srgb, <color> 55%,
var(--color-muted))` — for the card's icon, title and border-top, and the raw colour is
spent only on the hover bloom, so seventeen hues read as one shelf.

### Light theme — shipped

`tokens.css` ships `[data-theme="patina-light"]` (parchment `#f2e5bc`, ink `#4f3829`).
The floor is fully themed; `src/lib/theme.ts` resolves stored choice > system
preference, an inline pre-paint script in every `<head>` applies it before first
paint, and the header's light switch stores `ampactor_theme`. **The cabinet is a
physical object and stays dark in a lit room:** `.cabinet-scope` in `theme.css` pins
every token the arcade reads to its dark value. When it zooms, its backdrop covers the
room: the lights go off, the machine takes over.

### Usage rules

- **One spotlight per view.** Cyan is the accent of last resort.
- **Text is parchment, not white.** Never `#fff` on the dark surfaces.
- **Never use `--color-cyan` for text on the page background** — use `--accent-text`.

---

## 4 · Typography

**Four faces, each with one job.**

| Token | Font | Used for |
|---|---|---|
| `--font-arcade` | **Press Start 2P** | Signage: section eyebrows, the wordmark, the nav, the cabinet's chrome. ALL-CAPS, wide tracking, **tiny** (7–9 px on the floor). Never body text. It has no `▸` and no accented capitals: write `RESUME`, not `RÉSUMÉ`, in this face. |
| `--font-display` | **Share Tech Mono** | Card titles, CTAs, readouts, the timeline's names. Weight 400; size and glow carry emphasis. |
| `--font-body` | **JetBrains Mono** | Labels, stack chips, status lines, numbers, the cabinet's prose. |
| `--font-sans` | **Inter** | The floor's prose: the name, the line of range, outcomes, ledes. The reading face; tabular numerals for data. |

Scale on the floor is by `clamp()`: the name `clamp(38px, 5.4vw, 60px)`, section titles
`clamp(26px, 3.4vw, 36px)`, ledes `clamp(16px, 1.6vw, 18px)`. Body line-height 1.5–1.6.

**Self-hosted, and nothing moves when they arrive.** The latin subsets live in
`public/fonts/` (all four under the OFL; `public/fonts/README.md`), declared in
`src/styles/fonts.css`. Inter and Press Start 2P are preloaded from the head, the
two faces that paint first. Each family is followed in its stack by a fallback face
sized to it from the real metrics (`size-adjust` for the mean advance, ascent and
descent overrides for the line box): Arial or its metric twins for Inter, a 0.6 em
monospace for the other three. Text laid out before a font arrives takes the same room
after, and the pages measure CLS 0. No page requests anything from another origin
(`e2e/network.spec.ts`).

---

## 5 · Motion & Glow

### The zoom

The cabinet is always laid out at its zoomed size (`min(900px, 100vw)` × `100dvh`,
measured by a hidden probe) and scaled into its slot by CSS (`--k`). Entering is a
single transform tween from the slot rect to identity (`0.55 s power3.inOut`), leaving
is the reverse (`0.45 s`); nothing inside reflows, the CRT effects stay lit, and the
type is identical at both depths. The dark backdrop fades in over `0.35 s`. CSS owns
the resting transform, GSAP owns the transition, React owns `data-zoomed`.

### The cold open (first visit)

A first visit to `/` opens inside the machine, the way the site always used to: the
dark room, the tunnel and the A-mark, the tube igniting onto the test card, the boot
roll starting with `OPERATOR: MORGAN ESPITIA`, then at `2.3 s` the camera pulls back
(`0.9 s power3.inOut`, the room's lights coming up over the first `0.54 s`) to the
top of the page, where the same name is waiting. Any key, press, wheel or touch ends it
at once; a Tab also moves focus as usual. It never runs for a returning visitor, a
floor anchor, `/arcade/` or reduced motion, it never touches the URL or history, and
while it runs the machine is a picture: hidden from assistive tech, its controls
inert, the floor underneath readable. An inline pre-paint script decides (so the room
is dark from the first frame in either theme); `src/arcade/zoom/coldOpen.ts` has the
rules.

### Attract, boot, power-on

On the floor the tube runs an attract loop: test pattern → PRESS START → one cartridge
at a time. Zoomed, a first walk-up fires the tube (the chassis is already there), then
the boot roll; a returning visitor, or anyone who saw the cold open, lands on the
select screen. A machine that was already full-screen at load (a hard load of
`/arcade/`, the cold open) gets the whole-console power-on: there was nothing on screen
before it. The test card holds until the tube is fully lit, then fades into the boot
roll.

### Interaction motion (floor)

- Links: colour fade to the accent, `0.15 s`.
- Primary CTA: bloom + `translateY(-1px)`, `0.18 s`.
- Cards: `translateY(-3px)` + a bloom in the project's raw colour.
- Walking up to the cabinet: the tube brightens a touch under the pointer.

### Reduced motion — non-negotiable

Every animated surface honours it: there is no cold open, the zoom becomes a cut with
a `150 ms` backdrop fade, the intro completes immediately, the attract loop holds on
PRESS START, and every floor transition is off (`global.css`).

---

## 6 · Spacing & Layout

- **Responsive by `clamp()`, not breakpoints**, with three exceptions that are about
  posture rather than size: the hero goes two-column at `960px`, the `‹ FLOOR` control
  hangs from the top edge under `1000px` (no margin to sit in), and the hero hint hides
  under `600px`.
- **Single reading column, `--page-max: 1100px`, gutter `clamp(16px, 4vw, 40px)`.**
- **Grids auto-fill:** `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` for cards.
- **The slot reserves the miniature's exact footprint** (`zoomW × k` by `zoomH × k`), so
  the page never reflows when the stage leaves it to go full screen. The floor scale is
  capped at `0.72` so a phone's cabinet is still a machine on the floor, not the arcade.
- **No `transform`, `filter`, `backdrop-filter` or `contain` on the stage or any of its
  ancestors.** The stage positions a fixed backdrop against the viewport; a transformed
  ancestor would become its containing block. The header may blur: it is a sibling.
- **Radii:** 4 px (chips), 6 px (buttons), 10 px (cards), 16 px (the cabinet).

---

## 7 · Iconography & Marks

- **A-mark** (`src/ui/AMark.tsx`): an "A" drawn as two cyan strokes with a sine-wave
  squiggle through the crossbar and two serif feet — the amp and the wave. The only logo.
- **Wordmark:** `AMPACTOR` in Press Start 2P, `letter-spacing: 0.2em`, the accent.
- **Glyph language — Unicode symbols, not icon fonts:** `▸` (run/enter, in Share Tech
  Mono or Inter, never Press Start), `◈`, `∿`, `☀`, `♫`, `⚡`, `⚔`, `●`.

---

## 8 · Components

### Floor

| Component | Spec |
|---|---|
| **Header** | Sticky, blurred. A-mark + `AMPACTOR`; nav `WORK · RECEIPTS · HOW I WORK · ARCADE · RESUME · GITHUB` in Press Start 7 px; the light switch (`ThemeToggle`, `aria-pressed`). Shared by every page: on the floor ARCADE zooms the cabinet, elsewhere it is a link to `/arcade/` and the anchors point back at the floor. Inert while the cabinet is zoomed. |
| **Hero** | Eyebrow (`AMPACTOR LABS · SALT LAKE CITY`) → `<h1>` name in Inter 600 → the line of range → status line (`●` verdigris, "Available — full-time or contract · Salt Lake City, UT · remote") → `Email →` primary, `Résumé` and `Enter the arcade ▸` ghosts → a one-line hint. |
| **Slot + stage** | The cabinet's footprint on the floor. The stage holds the console, the backdrop (tunnel, A-mark, game) and the two controls: the transparent **Enter the arcade** button over the whole machine (the only tab stop on the floor; the panel beneath is `inert`) and, when zoomed, **`‹ FLOOR`**. |
| **SectionHeading** | Press Start eyebrow + hairline rule, Inter `<h2>`, optional lede. The repeating chapter heading. |
| **Shelf / Cartridge** | One auto-fill grid of every project. Card: icon in the muted accent, `lang`, Share Tech Mono title, `CATEGORY · subtitle`, `outcome`, up to four stack chips, `Live →` / `Source →` / `▸ Cabinet` (zooms straight to that cartridge). |
| **Ledger teaser** | The ledger's front step: `N commits, in the open`, three numbers and a nine-month strip from `receipts.summary.json`, `Open the ledger →`. |
| **How I work** | Three claims a reader can check against this repository: end to end; published losses; AI in the loop, hands on the wheel, with the ledger's own count of commits that name Claude. |
| **Timeline** | SVG from `resume.json`: employment as amber bars, the studio faint until it became the whole job, then cyan. `<title>` and `<desc>` carry the data for screen readers. |
| **Footer** | Email, GitHub, LinkedIn, location; `React 19 · Vite 8 · TypeScript · source →`. |

### Receipts (`/receipts/`)

The data surface. Same room, same tokens, working furniture: tabular numerals
wherever a number sits, hairline cards, the cyan spent on the marks.

| Component | Spec |
|---|---|
| **FilterBar** | One row: range presets (`All · 3 mo · 6 mo`, measured from the ledger's last month so a link means the same thing next week), From/To month selects, subject search (debounced 150 ms), `Include merges`, `Reset` when anything is set. Below it, every repository as an `aria-pressed` chip with a live count of what the other filters leave. Everything writes to the URL. |
| **StatTiles** | Six answers to the filter: commits, repositories, lines added, lines removed, active days, with Claude. Value in Share Tech Mono, one line of context under it (`of 3,859`, `net +1.1M`, `4.8% as author or co-author`). |
| **Charts** | Hand-rolled SVG, drawn at real pixel width (never a stretched viewBox). Every figure: title, unit line, `Chart | Table` switch, `<title>`/`<desc>`, a hover tooltip inside the figure, hit targets the height of the column. Commits per month (one hue, the highest month labelled, click narrows the range); lines added and removed (diverging, shared scale, legend + direct labels); commits by repository (ranked bars with values, click toggles the repository). Thin marks, rounded at the data end, square at the baseline; recessive grid. |
| **LedgerTable** | TanStack Table for the column model and header state, TanStack Virtual for the rows, a real `<table>` with explicit roles because flex rows lose their semantics. Sortable headers with `aria-sort` (dates and numbers descend first; the sort lives in the URL and is applied once, so the export matches the screen). One tab stop per row; arrows, PageUp/Down, Home/End walk rows that may not be drawn yet. Badges: `merge`, `∿ claude`, `✓ checked`. Under 640 px each row is a card with labelled numbers. |
| **CommitDrawer** | A native `<dialog>`: repo · sha (link), the subject as `<h2>`, date in the commit's own zone, author and co-authors, `+a −d · n files`, the message body from its shard reflowed into paragraphs (lists, indents and trailers keep their breaks), the `Checked:` paragraph set apart, `View on GitHub →`, `Only <repo>`. Escape, backdrop, focus trap and focus return are the browser's. |
| **ExportForm** | zod over the raw form values, built against the slice (a row limit cannot exceed it): format, rows (commits / by month / by repository), line counts, file name (safe characters, auto-named after the slice until typed), optional row limit. Errors inline under the field via `aria-describedby` + `aria-invalid`, shown once a field is visited; the button is disabled until valid and names the file it will write. The preview is the real output's first lines with its size. The file is a Blob; a `role="status"` toast confirms it. |

### Cabinet (bespoke, change with care)

- **Attract screen** (`AttractScreen.jsx`) — the loop on the floor; the test pattern is
  shared with the boot's phase 0 (`TestPattern.jsx`).
- **Cartridge / program rows** in the select screen; **SYS/READOUT** detail panel
  (`outcome` → `desc` → highlights → stack → operator notes); **boot sequence**
  (`useIntroSequence`, two variants); **insert-coin mechanic**, **hidden programs**.
- Zoomed, the console is `role="dialog" aria-modal="true" aria-label="Arcade"`, the
  floor is `inert`, focus moves in and back out to the Enter control.

---

## 9 · Content Model

Each project (`src/data/projects.js`) is the real résumé unit:

```js
{
  id, title, subtitle,            // identity
  color, icon,                    // per-project visual identity
  github, live, liveLabel,        // links (live = deployed product URL, optional)
  lang, stack, tags,              // facts
  outcome,                        // register 1 — floor card, résumé
  tagline,                        // register 2 — ALL-CAPS arcade hook
  desc, highlights, operatorNote, // register 3 — the cabinet readout (desc/operatorNote from the README)
  status, category,
}
```

`src/data/resume.json` holds the résumé (roles with years, bullets, selected public
work, skills); `src/data/site.js` holds the per-page `<head>` and the line of range.

---

## 10 · Information Architecture

```
/                 → the floor; the cabinet in attract mode
/arcade/          → the cabinet, zoomed (a real static entry; Back returns to the floor)
/arcade/#<id>     → a cartridge open in the cabinet (shareable)
/receipts/        → the ledger; ?from=&to=&repo=&q=&merges=0&sort=-key is the whole view
/resume.html      → static, zero-JS, print/ATS, generated from resume.json
```

The ledger writes its view with `replaceState` (typing a search must not bury Back)
and re-reads the address on `popstate`; defaults are omitted so the plain URL stays
plain, and anything unparseable falls back to the default instead of breaking the page.

The URL is the source of truth (`src/arcade/zoom/arcadeRoute.ts`). Entering from the
floor pushes `/arcade/`; opening a cartridge pushes `/arcade/#id`; Back walks cartridge
→ select → floor and Forward walks back in. A deep link gets a select entry laid down
beneath it. Leaving a hard-loaded `/arcade/` gives the floor its own entry, so Back
returns into the arcade. `ampactor_visited` only decides whether the boot plays.

---

## 11 · Accessibility

- Every page passes axe in the browser suite (`e2e/floor.spec.ts`).
- One focus ring everywhere (`:focus-visible`, `--accent-text`).
- The floor's cabinet is one control with an accessible name and a description; its
  panel is `inert`. Zoomed, it is a modal dialog and the rest of the page is `inert`.
- Focus moves into the cabinet on zoom and back to the Enter control on exit; Escape
  leaves; browser Back leaves.
- Decorative SVG and glyphs are `aria-hidden`; the timeline SVG has `<title>`/`<desc>`.
- External links: `target="_blank"` + `rel="noopener noreferrer"`.
- `prefers-reduced-motion` honoured everywhere (§5). No `AudioContext` is created by a
  floor gesture; audio starts only once the arcade is entered.
- Contrast: parchment on charcoal and the deepened accent on parchment both clear AA at
  the sizes used; keep muted/comment text at ≥ 11 px mono / 12 px sans.

---

## 12 · Do / Don't

**Do**
- Lead with the outcome; keep the numbers one layer deeper.
- Spend cyan like spotlight; use `--accent-text` for anything read on the page.
- Keep the floor's prose in Inter, its readouts in mono, its signage in Press Start.
- Honour reduced motion in any new animation.
- Keep the slot and its ancestors free of transforms and filters.

**Don't**
- Don't introduce a second sans, pure white text, or flat-black backgrounds.
- Don't let a generator re-skin the cabinet (GSAP/canvas/audio) — explore the floor.
- Don't hand-edit `tokens.css`, `public/resume.html`, or any generated file.
- Don't add a title or an industry under the name. Don't bury "Available".
- Don't write `▸` or accented capitals in Press Start 2P.
- Don't add marketing adjectives. Concrete nouns and numbers only.

---

## 13 · Changing the System

- **Tokens** (palette/type/motion): edit the upstream `ampactor-theme` YAML and re-run
  `export/to-css.sh` → regenerates `public/tokens.css`.
- **Semantic tokens and theming** (`src/styles/theme.css`): hairlines, surfaces,
  `--accent-text`, the light overrides, the cabinet's dark island. Add new semantic
  colours here, derived from the palette, not as literals in components.
- **Heads and the line of range**: `src/data/site.js`. Rendered into every entry by
  `vite.config.js`.
- **Identity and contact**: `src/data/profile.js`.
- **The work**: `src/data/projects.js`; content fields follow each README
  (`npm run sync:readmes`).
- **The résumé and the timeline**: `src/data/resume.json`; `npm run resume:build`.
- **The social card**: `node scripts/render-og.mjs` against a running preview.
- **Verify**: `npm run lint && npm run typecheck && npm test && npm run e2e && npm run build`.
  CI runs the same on every push; `main` deploys.

---

## 14 · AI Handoff Brief

_Paste this block into a design tool as the brand context. Scope any generation to
**the floor** — not the bespoke arcade._

> **Brand:** Ampactor Labs — the portfolio of Morgan Espitia, a software engineer in
> Salt Lake City who makes compilers, synths, games, and the apps around them.
> **Concept:** "Patina Dark" — one room, one machine. A worn arcade CRT rendered with
> engineering precision stands in a calm, readable page in its own light. Click it and
> it fills the screen. Confident, terse, buyer-framed voice; receipts over claims.
>
> **Palette:** dark radial `#1d2021 → #2a2826 → #0f0e0d` (light: parchment `#f2e5bc`,
> ink `#4f3829`); primary text parchment `#d4be98` (never white); hero accent electric
> cyan `#00E5FF` as a spotlight (as text on light backgrounds, deepen to `#00708a`);
> secondary amber `#d8a657`; muted `#a89984`; faint `#5a524c`. Per-card project colours
> muted 55% toward `#a89984`.
>
> **Type:** Inter for prose (name, one line of range, outcomes); Share Tech Mono for
> titles, CTAs and readouts (weight 400); JetBrains Mono for labels, chips and numbers;
> Press Start 2P only as tiny ALL-CAPS signage (eyebrows, nav, wordmark).
>
> **Layout:** single column ≤ 1100 px, `clamp()` rhythm, auto-fill card grids, hairline
> low-alpha borders with a coloured border-top, radii 6/10/16 px, soft blooms on hover,
> reduced motion honoured. The cabinet's slot is a fixed footprint on the right of the
> hero (stacked on phones), with the machine scaled to ~0.7.
>
> **Floor sections, in order:** header (A-mark wordmark, nav, light switch) → hero (name
> → one line of range → `● Available` status → Email / Résumé / Enter the arcade → the
> cabinet in attract mode) → THE WORK (17 cards) → HOW I WORK (three checkable claims) →
> SINCE 2017 (employment timeline) → footer.
>
> **Goal:** a page a hiring manager reads in a minute and a machine they want to touch.
> Don't redesign the arcade; don't add a title or an industry under the name; don't use
> white text; don't bury "Available" or the email.
