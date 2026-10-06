# Ampactor Labs — Design System

**One canonical reference for the brand, the visual language, the components, and the
voice.** Read it before touching any UI in this repo; hand it to a designer or an AI
design tool as the brand context.

- **Token source of truth:** `public/tokens.css` (auto-generated from the upstream
  `ampactor-theme` repo — `tokens/*.yaml` → `export/to-css.sh`). _Never hand-edit
  `tokens.css`; change the YAML upstream and rebuild._ The app's semantic layer on top of
  it is `src/styles/theme.css`.
- **Copy source of truth:** `src/data/profile.js` (identity, contact), `src/data/site.js`
  (every page's `<head>`), `src/data/projects.js` (the work, with content fields pulled
  from each project's README at build time), `src/data/programs.js` (the operator's
  three programs) and `src/data/resume.json` (the résumé, rendered to
  `public/resume.html` and rolled as the credits). Nothing is mirrored by hand any more.
- **This doc** is the layer the tokens and code don't carry: the concept, the usage
  rules, the component vocabulary, and the voice.

---

## 1 · Concept

**"Patina Dark" — a worn arcade CRT, rendered with systems-engineer precision.**

The site is the machine. There is no page around it: the cabinet stands in the dark
and fills the viewport, and everything a portfolio has to say is said in the idiom an
arcade cabinet already has. The **title card** (attract mode, at `/`) is the hero: the
name, the trade, `PRESS START`. START is the
**select screen** (`/arcade/`): the cartridges are the work, and the header is the
operator's sticker (name, email, phone, RESUME · GITHUB · LINKEDIN). At the end of
the list sit the **operator's programs**: `HOW TO PLAY` (the controls), `HIGH SCORES`
(the commit ledger), `CREDITS` (the career roll). Escape, B or the browser's Back step
out the way you came in, down to the title card. The coin slot is still a coin slot:
nothing on the site points at it, and the hidden programs are found, not linked.

One universe, one depth. The aesthetic is not nostalgia for its own sake — it is
**proof of craft**: every effect is hand-built (GSAP, canvas, a Web Audio synth), and
the two paper pages beside it (the ledger, the case study) are the product UI the same
hands make.

| Surface | Role | Feel |
|---|---|---|
| **Cabinet** (`src/arcade/`, `src/App.tsx`) | The whole page at `/` and `/arcade/`. Title card, boot, select, cartridge readouts, the operator's programs, hidden games. | The lit ground, every colour blooming in its own light, ambient audio once started. Always dark, whatever the theme. |
| **Pages** (`src/receipts/`, `src/craft/`, `public/resume.html`, `src/floor/` for their header and footer) | The paper: the commit log, the case study, the résumé and the 404. Fast, skimmable, light or dark. | Same palette; prose in a reading face; signage in the arcade face, tiny. |

The cabinet converts and rewards; the pages are the receipts. Design changes to one
must not flatten the other. **The pages are where design exploration belongs.** The
cabinet is bespoke craft; don't let a generator re-skin it.

---

## 2 · Voice

Morgan writes the words. The rules are three lines of Morgan's, quoted as written:

> say it PLAINLY - what am I really doing? what do I really want?

> LET THE AUDIENCE FIGURE OUT WHAT TO DO BY BEING IN THE SPACE THEY ARE PRESENTED WITH!

> BE AUTHENTIC AND MAKE LIGHT, GOOD TIMES ANYWAY!

What that means for the site:

- **Morgan's lines are Morgan's.** `WORDS` in `src/data/profile.js` and the taglines in
  `projects.js` are Morgan's. Claude may cut copy, move it, or leave a slot for Morgan
  to fill. Claude does not write a sentence that describes Morgan, and does not touch
  one of Morgan's lines.
- **Say what it is.** A cartridge's card, status and limits come from its README
  (`docs/README-STANDARD.md`) and are literally true. Headings name the thing. No
  slogans.
- **Let the machine teach.** No instructions to the reader, no explaining what to
  conclude, no asking to be trusted. The cabinet's own idiom (`PRESS START`, `INSERT
  COIN`, `NOW SHOWING`, `HIGH SCORES`, `CREDITS`, `HOW TO PLAY` for the controls) is the
  one voice the cabinet speaks for itself.
- **One fact, one place.** The name, the role, the contact, the city: once per screen.
  The panel plate says Salt Lake City; nothing above it says it again.
- **No tells.** No lists of three for rhythm, no "X, Y" taglines, no "X, not Y", no em
  dashes, no brand words worn as a personality ("receipts", "checkable", "the cases it
  loses"). Short lines. Lowercase is fine.
- **The pages are plain.** The commit log, the case study and the résumé are written
  for reading and for an applicant-tracking system: first person, short sentences,
  numbers with their source.

**Copy registers, by depth:**

1. `outcome` (projects.js): the first line of a cartridge's readout and the résumé,
   plain sentences; the page descriptions in `site.js`.
2. `tagline`: the arcade hook, ALL-CAPS, in-world.
3. `desc` / `highlights` / `operatorNote`: the technical detail, in the readout.

---

## 3 · Color

> **Naming caution:** the hero accent is **electric cyan `#00E5FF`** (`--color-cyan`).
> The muted **patina teal `#7daea3`** (`--color-teal`) is a different colour used as a
> syntax/role colour. "The cyan / the glow" always means `#00E5FF`.

### The cabinet's palette

The machine's own set, in `src/arcade/palette.js` by role and on `:root` as
`--cab-*`. Indigo and void for the grounds, mist and lilac for the text, magenta
as the machine's voice, cyan kept as the mark (`docs/AUDIT-NEON.md` section 3
has every ratio). Text sits only on void, room, raised and the band; never on
`line`, `lit` or `bandBright`.

| Role | Hex | Use |
|---|---|---|
| `void` / `room` / `raised` | `#0a0716` / `#15102e` / `#221a45` | The tube's bottom and insets; the room and the tube's centre; the console, the chassis and cards. |
| `line` / `lit` | `#3b2b7d` / `#6b3fd6` | Borders and hairlines; the lit grid and active fills. Never under text. |
| `band` / `bandBright` | `#2b1a5e` / `#4a2ca0` | The title band, dark end to bright end. |
| `text` / `muted` / `faint` | `#ece6fb` / `#b9a6e8` / `#8f7fb8` | The three text tiers. Faint never sits on the band. |
| `mark` | `#00e5ff` | The A-mark, the name, the A button, the ship, the tunnel. |
| `voice` / `voiceLt` | `#ff2fd2` / `#ff5ce1` | The machine's voice: PRESS START, READY., INSERT COIN, the lit row; the lighter one at 7 to 9 px. |
| `ok` / `mint` | `#00ffd0` | OK, status, deployed; lasers and the dust. |
| `quiet` / `halo` | `#b388ff` | The operator's programs and a status that is not live; the bloom behind the letters. |
| `coin` | `#ffb800` | The coin and only the coin. |
| `ember` | `#ff8a5c` | The one warm accent. |
| `danger` / `hot` | `#ff3b7a` / `#ff2266` | Danger text and B's label; strokes and glows only. |

The pages (`/receipts/`, `/craft/`, the résumé) still paint the Patina palette
below until their own step of the audit.

### Core palette (Patina Dark)

| Token | Hex | Role |
|---|---|---|
| `--color-cyan` | `#00E5FF` | **Hero accent.** Glow, the active item, the cabinet's signage, the name on the title card. Spend it like a spotlight. |
| `--accent-text` | cyan / `#00708a` | The accent **as text on a page background**. Cyan in the dark theme; deepened in the light theme, where electric cyan has no contrast on parchment. Use this, not `--color-cyan`, for links, eyebrows, CTAs and the focus ring on the pages. |
| `--color-amber` | `#d8a657` | Secondary accent: `PRESS START`, the operator's programs, INSERT COIN, employment, caution. |
| `--bg` / `--color-charcoal` | `#1d2021` | Page background (top of the radial). |
| `--color-dim` | `#2a2826` | Mid background, the cabinet's chassis. |
| `--color-void` | `#0f0e0d` | Deepest background, insets, the dark behind the machine. |
| `--fg` / `--color-parchment` | `#d4be98` | **Primary text.** Warm parchment, never white. |
| `--fg-bright` | `#efe4cc` | Headlines, one step brighter than body. |
| `--fg-muted` / `--fg-faint` | `#a89984` / `#9a8e81` (light `#665a50` / `#6b5f54`) | Secondary and tertiary **text** on the pages. Both clear 4.5:1 on every surface the page paints in either theme; the palette's own `--color-muted` / `--color-comment` stay for fills, `color-mix` recipes and the cabinet's dim readouts, never for page text. |
| `--chart-1` | `#22c3dc` (light `#00708a`) | The one hue for magnitude in a chart: commits per month, commits by repository, the HIGH SCORES bars. Validated with the dataviz palette checker against each theme's chart surface. |
| `--chart-pos` / `--chart-neg` | `#3aa886` / `#e26a62` (light `#0a8f9c` / `#c14a4a`) | The diverging pair: lines added above the baseline, lines removed below it. The dark pair sits in the colour-blind floor band (ΔE 6.7), so sign is always also carried by position, a legend and direct labels. Text in a chart wears text tokens, never a series colour. |
| `--hairline`, `-strong`, `-faint` | `color-mix` of `--fg` | Borders and rules; derived, so right in both themes. |
| `--surface`, `--surface-raised` | `color-mix` of `--fg` | Card fills. |

### Per-project colour

Each project owns one neon in `projects.js`, used raw in the cabinet: the row's icon
tile and its lit bar, the title when the row is active, the readout's faint bleed
behind the screen. The operator's programs share the quiet violet. The pages paint no project
colour; the ledger's repository chips are monochrome.

### Light theme — shipped

`tokens.css` ships `[data-theme="patina-light"]` (parchment `#f2e5bc`, ink `#4f3829`).
The pages are fully themed; `src/lib/theme.ts` resolves stored choice > system
preference, an inline pre-paint script in every `<head>` applies it before first
paint, and the pages' header has the light switch, which stores `ampactor_theme`.
**The cabinet is a physical object and stays dark in a lit room:** every colour
the arcade paints comes from `src/arcade/palette.js`, by role (`PALETTE.voice`,
`PALETTE.mark`, `alpha(PALETTE.coin, 0.4)`), and the same set reaches the
stylesheets as `--cab-*` custom properties written on `:root` by the document
head, so no theme can reach them. `src/arcade/__tests__/palette.test.js` holds
every text role against every ground to 4.5:1 and lists the pairs that still
fall short. `/` and `/arcade/` mark `html[data-stage]` from an inline script so
the dark behind the machine is painted before the first frame in either theme.

### Usage rules

- **One spotlight per view.** Cyan is the accent of last resort.
- **Text is parchment, not white.** Never `#fff` on the dark surfaces.
- **Never use `--color-cyan` for text on a page background** — use `--accent-text`.

---

## 4 · Typography

**Four faces, each with one job.**

| Token | Font | Used for |
|---|---|---|
| `--font-arcade` | **Press Start 2P** | Signage: the name on the title card, screen titles (`SELECT PROGRAM`, `HIGH SCORES`), `PRESS START`, the operator's pills, section eyebrows, the pages' nav. ALL-CAPS, wide tracking; **tiny** on the pages (7–9 px). Never body text. It has no `▸` and no accented capitals: write `RESUME`, not `RÉSUMÉ`, in this face. |
| `--font-display` | **Share Tech Mono** | Row titles, CTAs, readouts, the credits' names. Weight 400; size and glow carry emphasis. |
| `--font-body` | **JetBrains Mono** | The cabinet's prose and labels, stack chips, status lines, numbers. |
| `--font-sans` | **Inter** | The pages' prose: the ledger's copy, the case study, the 404. The reading face; tabular numerals for data. |

Type in the cabinet scales with the screen's width (`fs()` in `useCabinetState`: ×1 at
300 px, ×1.25 from 475 px); the name on the title card is `min(38px, width / 16)`. On
the pages the scale is by `clamp()`: titles `clamp(26px, 3.4vw, 36px)`, ledes
`clamp(16px, 1.6vw, 18px)`. Body line-height 1.5–1.6.

**Self-hosted, and nothing moves when they arrive.** The latin subsets live in
`public/fonts/` (all four under the OFL; `public/fonts/README.md`), declared in
`src/styles/fonts.css`. Inter and Press Start 2P are preloaded from every head. Each
family is followed in its stack by a fallback face sized to it from the real metrics
(`size-adjust` for the mean advance, ascent and descent overrides for the line box):
Arial or its metric twins for Inter, a 0.6 em monospace for the other three. Text laid
out before a font arrives takes the same room after, and the pages measure CLS 0. No
page requests anything from another origin (`e2e/network.spec.ts`).

---

## 5 · Motion & Glow

### The power-on (first visit)

A first visit (nothing in `localStorage`) powers the machine on out of the dark: the
tunnel and the A-mark flicker up behind it, the chassis comes in, the tube fires onto
the test card (`BOOT_PATTERN_MS`, 350 ms), and the boot roll prints its BIOS lines
(`OPERATOR: MORGAN ESPITIA`, `AMPACTOR BIOS v7.7.7`, … `READY.`) in a burst
(`BOOT_LINE_MS`, 40 ms a line), holds a beat on `READY.` (`BOOT_BEAT_MS`, 350 ms) and
lands where the URL points: the title card at `/`, the list at `/arcade/`. About two
and a half seconds in all, the ignition included. Any key or tap during it skips
ahead. It never runs
for a returning visitor (`ampactor_visited`) or a deep-linked cartridge, and it never
touches the URL or history. Under reduced motion the tween is skipped and the BIOS
still prints: it is text.

### The attract loop

The title card holds 6 s, then `NOW SHOWING` runs four cartridges at 2.6 s each, then
`HIGH SCORES` 6 s, then the WINNERS DON'T USE DRUGS splash every cabinet of the period
ran, 2.5 s, and round again with the next four. Every frame glitches in.
`PRESS START` blinks (`startBlink`, 1.1 s, step-end, never fully off). `◄` `►` and the
arrow keys step the loop by hand; START, A, Enter, Space, a tap on the tube or a coin
start the machine. No `AudioContext` exists until then. Someone reading holds it: a
pointer over the tube, a finger on it or focus inside keeps the frame on screen, and the
loop carries on from the top of that frame when they leave.

### Between pages, and down the page

Leaving the cabinet for the ledger (`HIGH SCORES → FULL LEDGER`), the case study
(`HOW TO PLAY → HOW THIS CABINET IS BUILT`) or the résumé, and coming back by the
A-mark, is a cross-document view transition: the old page fades (`160 ms`) as the new
one rises `10 px` into place (`240 ms`); between the two paper pages the header
(`view-transition-name: site-header`) holds still. On the case study each block
settles `14 px` into place as it scrolls into view, driven by the scroll position
itself (`animation-timeline: view()`, no script). Browsers without either feature get
the plain page.

### Interaction motion

- Cabinet rows: the bar and the title take the project's colour, `0.2 s`; a hover blips.
- Cabinet links: the focused pill carries the ring; A opens it.
- The credits roll at `26 px/s` and pause `3.5 s` on a touch, a wheel or a focus.
- Page links: colour fade to the accent, `0.15 s`. Primary CTA: bloom +
  `translateY(-1px)`, `0.18 s`.

### Reduced motion — non-negotiable

Every animated surface honours it: the power-on is a cut (the BIOS still prints),
the title card holds still and `PRESS START` does not blink, the credits stand, pages
cut instead of crossfading, every block is simply there, and every page transition is
off (`global.css`).

---

## 6 · Spacing & Layout

- **The console is the viewport:** `min(900px, 100vw)` wide, `100dvh` tall, centred in
  the dark (`stage.module.css`). The page never scrolls; the screens scroll inside the
  tube (the list, a readout, the credits).
- **Inside the tube, `fs()` is the one scale** (§4); paddings are in px and do not
  scale.
- **The pages: single reading column, `--page-max: 1100px`, gutter
  `clamp(16px, 4vw, 40px)`, responsive by `clamp()`, not breakpoints.**
- **Grids auto-fill:** `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` for cards.
- **No `transform`, `filter`, `backdrop-filter` or `contain` on `main` or the stage's
  ancestors.** The stage is a fixed layer; a transformed ancestor would become its
  containing block.
- **Radii:** 4 px (chips), 6 px (buttons), 10 px (cards), 16 px (the cabinet).

---

## 7 · Iconography & Marks

- **A-mark** (`src/ui/AMark.tsx`): an "A" drawn as two cyan strokes with a sine-wave
  squiggle through the crossbar and two serif feet — the amp and the wave. The only logo.
- **Wordmark:** `AMPACTOR` in Press Start 2P, `letter-spacing: 0.2em`, the accent.
- **Glyph language — Unicode symbols, not icon fonts:** `▸` (run/enter, in Share Tech
  Mono or Inter, never Press Start), `◈`, `∿`, `☀`, `♫`, `⚡`, `⚔`, `●`, `★`, `≡`.

---

## 8 · Components

### Cabinet screens (bespoke, change with care)

| Screen | Spec |
|---|---|
| **Title card** (`AttractScreen.jsx`) | `<h1>` name in Press Start, cyan, glowing → `SOFTWARE ENGINEER` in amber → a borrowed line (`quotes.js`: SHALL WE PLAY A GAME? for a first visit, KEPT YOU WAITING, HUH? for a returning one) → `PRESS START` (a `<button>`). Nothing else: the sticker on the select screen has the contact and the links. The `<h1>` stays in the DOM (visually hidden) on the loop's other frames. It fits a short phone (375×548) above `PRESS START`. |
| **Boot** (`BootScreen.jsx`) | Phase 0 the test pattern (shared with the attract loop's `TestPattern.jsx`), phase 1 the BIOS column laid out at its final height and printed top to bottom in a burst (`BOOT_LINE_MS`, 40 ms a line); the operator's sign-off (`WORDS.boot`), lit cyan like the `OPERATOR:` line, then a beat on the last line, `READY.`, in Press Start and amber, and the title card. Any key or tap skips ahead. |
| **Select** (`SelectScreen.jsx`) | The operator's sticker: `SELECT PROGRAM`, `<h1>` `NAME · ROLE`, email and phone as links, and `<nav aria-label="Operator">` with the pills `RESUME` (`/resume.html`) · `GITHUB` · `LINKEDIN`. Then the `listbox` (`Project list`), which takes focus when the screen comes up and names its active row with `aria-activedescendant`: category headers `SYSTEMS · SECURITY · WEB3 · CREATIVE · OPERATOR`, one row per program (icon tile in the program's colour, title in Share Tech Mono, `lang` chip, subtitle), three `[CLASSIFIED] · YOU DIDN'T SAY THE MAGIC WORD` rows until the coin drops, the marquee (the cartridges and their taglines, `constants.js`). |
| **Cartridge readout** (`DetailScreen.jsx`) | `◄` back, icon, `<h2>` title, subtitle, the link rail (demo first, then source), then `outcome` → `desc` → highlights → stack → operator notes in a scrolling, focusable region. |
| **Operator programs** (`SystemScreen.jsx`, data in `programs.js`) | Same head as a readout, amber. `HOW TO PLAY`: IT'S DANGEROUS TO GO ALONE! TAKE THIS., then `CONTROLS`, what the panel does; rail `▸ HOW THIS CABINET IS BUILT` (`/craft/`) · `› THE README STANDARD`. `HIGH SCORES`: the top-10 table (`RANK · NAME · SCORE`, repositories by commits), the last twelve months as bars (`role="img"` with the numbers in its name), the `CO-OP` line; rail `▸ FULL LEDGER` (`/receipts/`) · `› GITHUB`. `CREDITS`: the career roll from `resume.json`, the tests as the crew, and the operator's sign-off (`WORDS.credits`) where `THANK YOU FOR PLAYING` would be; rail `▸ FULL RÉSUMÉ` · `› SOURCE`. |
| **Panel** (`Cabinet.jsx`) | D-pad (`Navigate up/down/left/right`), `B` (`Back`), `A` (`Select` / `Open link`), the A-mark plate, the coin slot (`Insert coin`). On the title card `◄ ►` step the loop and A starts; on the list the d-pad walks rows and A opens; on a readout up/down scroll, left/right walk the rail, A opens the focused link, B goes back. |
| **Hidden programs** | Unlocked by the coin, wherever it is dropped, or by the Konami code on a keyboard; the ceremony says CREDIT ACCEPTED and IT'S A SECRET TO EVERYBODY.; a link straight to one (`/arcade/#tunnel-run`) drops the coin for the visitor. `TUNNEL_RUN` plays on the backdrop with the console faded out. Never linked from the site's own copy. |

### Pages header and footer (`src/floor/`)

| Component | Spec |
|---|---|
| **Header** | Sticky, blurred. A-mark + `AMPACTOR` (a link home, `Ampactor Labs, home`); nav `ARCADE · COMMITS · CRAFT · RESUME · GITHUB` in Press Start 7 px, the current page marked `aria-current="page"`; the light switch (`ThemeToggle`, `aria-pressed`). On a phone it stays one line from 360 px: the brand is the A-mark alone and the nav tightens. |
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

### Craft (`/craft/`)

The case study, set as a document in the same room. Every number is read from
`src/data/audit.json` (`npm run audit`) or the ledger's summary; the page types
none of its own, except the "before" column, which quotes the commit that
changed it.

| Component | Spec |
|---|---|
| **Page head** | `CRAFT` eyebrow, Inter `<h1>`, the lede, the stack as one mono line with `·` separators, six measured tiles (a `<ul aria-label="Measured">`: value in Share Tech Mono on top, label, one line of source), then the measured line: date, tool, form factor, "median of 3 runs", a link to `scripts/audit.mjs`. |
| **Contents rail** | `<nav aria-label="On this page">`, numbered `01`–`05`. A sticky column beside the chapters from 1000 px; below that, one wrapped row between hairlines. |
| **Chapter** | A `<section>` with a numbered Press Start eyebrow (`01 · THE CABINET`) and an Inter `<h2>`, hairline between chapters. |
| **Fact cards** | The same three parts in every chapter: a `<dl>` of three hairline cards, `▸ Problem`, `◆ Approach`, `✓ Verification`, glyphs decorative. |
| **Points** | A `▸` list for decisions and tradeoffs, one or two plain sentences each. |
| **Tables** | Captioned, mono, tabular numerals, right-aligned values, row headers that may wrap, column headers that may wrap onto two lines so the values set the width. A table wider than its column scrolls inside a labelled, focusable region. |
| **Links row** | Mono links to the files a chapter talks about, on `main`. |

---

## 9 · Content Model

Each project (`src/data/projects.js`) is the real résumé unit:

```js
{
  id, title, subtitle,            // identity
  color, icon,                    // per-project visual identity
  github, live, liveLabel,        // links (live = deployed product URL, optional)
  lang, stack, tags,              // facts
  outcome,                        // register 1 — the readout's first line, the résumé
  tagline,                        // register 2 — ALL-CAPS arcade hook
  desc, highlights, operatorNote, // register 3 — the readout (desc/operatorNote from the README)
  status, category,
}
```

The operator's programs (`src/data/programs.js`) share the row shape (`id, title,
subtitle, lang: "OPERATOR", color, icon, category: "operator", tagline`) and declare
their `kind` (`howto | scores | credits`) and their link rail outright.
`src/data/resume.json` holds the résumé (roles with years, bullets, selected public
work, skills); `src/data/site.js` holds the per-page `<head>`.

---

## 10 · Information Architecture

```
/                 → the cabinet on its title card (attract mode)
/arcade/          → the select screen (a real static entry)
/arcade/#<id>     → a cartridge open in the cabinet (shareable), or an operator
                    program: #how-to-play, #high-scores, #credits
/receipts/        → the ledger; ?from=&to=&repo=&q=&merges=0&sort=-key is the whole view
/craft/           → how this site is built; #cabinet #commits #performance #testing #tradeoffs
/resume.html      → static, zero-JS, print/ATS, generated from resume.json
```

The ledger writes its view with `replaceState` (typing a search must not bury Back)
and re-reads the address on `popstate`; defaults are omitted so the plain URL stays
plain, and anything unparseable falls back to the default instead of breaking the page.

The URL is the source of truth (`src/arcade/zoom/arcadeRoute.ts`); the cabinet asks for
navigation with intents (`enter`, `open`, `back`, `exit`, `select`) and
`useArcadeHistory` owns the History API. START pushes `/arcade/`; opening a program
pushes `/arcade/#id`; Back walks program → list → title card and Forward walks back in.
A deep link gets a select entry laid down beneath it; a hash naming nothing is
corrected to `/arcade/` on load. Leaving a hard-loaded `/arcade/` gives the title card
its own entry, so Back returns to the list. `ampactor_visited` only decides whether the
power-on plays.

---

## 11 · Accessibility

- The title card, the select screen, HIGH SCORES, the ledger and the case study pass
  axe in the browser suite, at desktop and phone sizes, the ledger and the case study
  in both themes (`e2e/*.spec.ts`).
- Every screen has an `<h1>`: the name on the title card, `NAME · ROLE` on the select
  screen; an open program is an `<h2>`.
- One focus ring everywhere (`:focus-visible`, `--accent-text`); in the listbox the
  lit row is the indicator.
- The list is a `listbox` that takes focus when it comes up and names its active row;
  readouts scroll in focusable regions; every panel control is a named `button`.
- Escape and B step back; browser Back steps back; the title card's `PRESS START` is a
  real button and the email a real link.
- Decorative SVG and glyphs are `aria-hidden`; the HIGH SCORES bars carry their
  numbers in the image's name.
- External links: `target="_blank"` + `rel="noopener noreferrer"`.
- `prefers-reduced-motion` honoured everywhere (§5). No `AudioContext` is created on
  the title card; audio starts only once the machine is started.
- Contrast: parchment on charcoal and the deepened accent on parchment both clear AA at
  the sizes used; keep muted/comment text at ≥ 11 px mono / 12 px sans.

---

## 12 · Do / Don't

**Do**
- Lead with the outcome; keep the numbers one layer deeper.
- Spend cyan like spotlight; use `--accent-text` for anything read on a page.
- Keep the pages' prose in Inter, their readouts in mono, their signage in Press Start.
- Say it in the cabinet's idiom before adding a widget: a table is a high-score table,
  a bio is a credits roll, a link is a pill on the panel.
- Honour reduced motion in any new animation.
- Keep `main` and the stage's ancestors free of transforms and filters.

**Don't**
- Don't build a page around the cabinet, and don't link the coin slot or the hidden
  programs from anywhere: they are found.
- Don't introduce a second sans, pure white text, or flat-black backgrounds.
- Don't let a generator re-skin the cabinet (GSAP/canvas/audio) — explore the pages.
- Don't hand-edit `tokens.css`, `public/resume.html`, or any generated file.
- Don't add a title or an industry under the name. Don't bury "Available".
- Don't write `▸` or accented capitals in Press Start 2P.
- Don't add marketing adjectives. Concrete nouns and numbers only.

---

## 13 · Changing the System

- **Tokens** (palette/type/motion): edit the upstream `ampactor-theme` YAML and re-run
  `export/to-css.sh` → regenerates `public/tokens.css`.
- **Semantic tokens and theming** (`src/styles/theme.css`): hairlines, surfaces,
  `--accent-text`, the light overrides. Add new semantic colours here, derived
  from the palette, not as literals in components.
- **The cabinet's colours** (`src/arcade/palette.js`): the machine's own set, by
  role, and the `--cab-*` properties the head writes from it. A new hue in the
  arcade is a new role here, never a literal in a component; the contrast test
  runs on every change.
- **Heads**: `src/data/site.js`. Rendered into every entry by `vite.config.js`.
- **Identity, contact and Morgan's words**: `src/data/profile.js` (`WORDS`).
- **Borrowed lines**: `src/data/quotes.js`, each with its source in a comment.
- **The work**: `src/data/projects.js`; content fields follow each README
  (`npm run sync:readmes`). **The operator's programs**: `src/data/programs.js`.
- **The résumé and the credits**: `src/data/resume.json`; `npm run resume:build`.
- **The social card**: `node scripts/render-og.mjs` against a running preview.
- **Verify**: `npm run lint && npm run typecheck && npm test && npm run e2e && npm run build`.
  CI runs the same on every push; `main` deploys.

---

## 14 · AI Handoff Brief

_Paste this block into a design tool as the brand context. Scope any generation to
**the pages** (the ledger, the case study, the résumé) — not the bespoke arcade._

> **Brand:** Ampactor Labs — the portfolio of Morgan Espitia, a software engineer in
> Salt Lake City who makes compilers, synths, games, and the apps around them.
> **Concept:** "Patina Dark" — the site is an arcade cabinet, and the cabinet is the
> whole page: a worn CRT rendered with engineering precision, standing in the dark.
> The title card is the hero, the select screen is the work, the operator's programs
> (HOW TO PLAY, HIGH SCORES, CREDITS) are the rest of the portfolio, and two paper
> pages beside it carry the commit log and the case study. Morgan's words, plain; no
> slogans.
>
> **Palette:** dark radial `#1d2021 → #2a2826 → #0f0e0d` (light pages: parchment
> `#f2e5bc`, ink `#4f3829`); primary text parchment `#d4be98` (never white); hero
> accent electric cyan `#00E5FF` as a spotlight (as text on light backgrounds, deepen
> to `#00708a`); secondary amber `#d8a657`; muted `#a89984`; faint `#5a524c`.
>
> **Type:** Inter for the pages' prose; Share Tech Mono for titles, CTAs and readouts
> (weight 400); JetBrains Mono for labels, chips and numbers; Press Start 2P as
> ALL-CAPS signage (the cabinet's titles, the pages' tiny eyebrows and nav).
>
> **Layout:** the cabinet fills the viewport (≤ 900 px wide) and never scrolls; the
> pages are a single column ≤ 1100 px, `clamp()` rhythm, auto-fill card grids,
> hairline low-alpha borders, radii 6/10/16 px, soft blooms on hover, reduced motion
> honoured.
>
> **Screens, in order:** title card (name → role → two lines of Morgan's → PRESS START)
> → select screen (operator's sticker with RESUME · GITHUB · LINKEDIN, the
> cartridges by category, then OPERATOR: HOW TO PLAY · HIGH SCORES · CREDITS) →
> readouts. **Pages:** header (A-mark, nav, light switch) → the commit log / the case
> study → footer.
>
> **Goal:** a machine a hiring manager wants to touch, that still gets them the résumé
> in one press. Don't redesign the arcade; don't build a page around it; don't add a
> title or an industry under the name; don't use white text; don't bury "Available" or
> the email.
