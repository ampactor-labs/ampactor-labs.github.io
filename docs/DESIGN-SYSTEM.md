# Ampactor Labs — Design System

**One canonical reference for the brand, the visual language, the components, and the
voice.** This is the source you hand to a designer, paste into an AI design tool
(Claude Design, etc.), or read before touching any UI in this repo.

- **Token source of truth:** `public/tokens.css` (auto-generated from the upstream
  `ampactor-theme` repo — `tokens/*.yaml` → `export/to-css.sh`). _Never hand-edit
  `tokens.css`; change the YAML upstream and rebuild._
- **Copy source of truth:** `src/data/profile.js` (identity, positioning, proof) and
  `src/data/projects.js` (the work). `public/resume.html` and `index.html` mirror this
  copy **by hand** — keep all three in sync.
- **This doc** is the layer the tokens and code don't carry: the concept, the usage
  rules, the component vocabulary, and the voice.

> **For an AI design tool:** jump to [§14 AI Handoff Brief](#14--ai-handoff-brief) —
> it's a paste-ready, on-brand prompt block. Read §1–§6 first if you want the why.

---

## 1 · Concept

**"Patina Dark" — a worn arcade CRT, rendered with systems-engineer precision.**

The portfolio is a working arcade cabinet: a `boot → select → detail/game` machine
with a phosphor-glow CRT aesthetic, monospace type only, scanlines, and an
insert-coin mechanic. The aesthetic is not nostalgia for its own sake — it's a
**proof of craft**: every effect is hand-built (GSAP cinematics, canvas shaders, a
Web Audio synth), signalling the same rigor the work itself claims.

Two surfaces, one world:

| Surface | Role | Feel |
|---|---|---|
| **Lobby** (`src/components/Lobby.jsx`) | The front desk. Fast, skimmable conversion surface. Paints instantly — no boot, no GSAP, no audio. | Same palette + fonts as the cabinet, but **calm**: light scanline, no overload, everything readable in ~10s. |
| **Cabinet** (`src/ArcadePortfolio.jsx`) | The arcade floor. Opt-in depth: cinematic boot, cartridge select, detail readouts, hidden games. | Full CRT theatre: heavy glow, boot sequence, scanlines, ambient hum, easter eggs. |

The Lobby converts; the Cabinet rewards. Design changes to one must not flatten the
other. **The Lobby is where most design exploration belongs** — it's a conventional
landing layout. The Cabinet is bespoke craft; don't let a generator re-skin it.

---

## 2 · Voice

**Confident, concrete, plain-spoken. Buyer-framed, never engineer-bragging.**

- **Lead with the outcome a non-engineer can map to money or risk**, then back it with
  the hard number. _"A live product that charges real money to tell you whether a
  crypto token is a scam — shipped and earning."_ not _"9 deterministic on-chain
  checks via Helius RPC."_ (The numbers live one layer deeper, in the cabinet readout.)
- **Tiered net.** The hard systems work leads as the premium anchor and the wow; the
  everyday web/API/dashboard work is stated plainly, same breath, same rigor. Never
  anchor low; never hide the bread-and-butter.
- **Terse, technical, lower-case-comfortable.** Mono fonts, `→` arrows, `·` separators,
  `●` status dots. No marketing adjectives ("cutting-edge", "passionate"). Let the
  artifacts carry the weight.
- **Own the gap as a deliberate story**, never apologize for it (studio / audio
  engineering / film → the through-line to DSP + embedded).

**Three copy registers, by depth:**

1. `outcome` — buyer-facing, one plain sentence (lobby cards, résumé). _"Write audio
   code once; run it unchanged on a desktop plugin and a $20 microcontroller."_
2. `tagline` — the arcade hook, ALL-CAPS, punchy. _"DESKTOP AND BARE METAL. SAME CODE."_
3. `operatorNote` / `highlights` — the engineer's proof, numbers and internals.

---

## 3 · Color

> **Naming caution for designers/AI:** the hero accent is **electric cyan `#00E5FF`**
> (token `--color-cyan` / `--highlight`). There is also a separate, muted **patina teal
> `#7daea3`** (`--color-teal`) used as a syntax/role color — a different color entirely.
> When this doc or the brand says "the cyan / the glow," it means `#00E5FF`. In code,
> always reference `var(--color-cyan)`; never reintroduce a `TEAL` alias for it (that
> misnomer was removed — cyan is not teal).

### Core palette (Patina Dark — the canonical theme)

| Token | Hex | Role |
|---|---|---|
| `--color-cyan` / `--highlight` | `#00E5FF` | **Hero accent.** Glow, primary CTA, the glowing headline word ("Rust"), active focus. Use sparingly — it's the spotlight. |
| `--color-amber` / `--ui-primary` | `#d8a657` | Secondary accent. The "everyday delivery" tier, cursor, caution. |
| `--bg` / `--color-charcoal` | `#1d2021` | Page background (top of the radial). |
| `--color-dim` | `#2a2826` | Mid background, panel fills. |
| `--color-void` | `#0f0e0d` | Deepest background (bottom of the radial), insets. |
| `--fg` / `--color-parchment` | `#d4be98` | **Primary text.** Warm parchment, not white. |
| `--color-muted` | `#a89984` | Secondary text, labels, captions. |
| `--color-comment` | `#5a524c` | Faint text, footer, disabled. |
| `--color-umber` | `#45403d` | Selection background, borders. |

### Accent set (used as per-project identity colors)

`#ea6962` coral · `#e78a4e` orange · `#d3869b` rose · `#89bfad` verdigris (signal-ok) ·
`#7daea3` teal · `#6a95a8` steel. Plus the per-project brand colors in
`projects.js` (electric yellow-green `#E0FF00`, magenta `#ff44aa`, etc.).

### Background treatment

```css
background: radial-gradient(ellipse at 50% 40%, #1d2021 0%, #2a2826 50%, #0f0e0d 100%);
```

Fixed-attachment, like light pooling at the center of a dark screen. Never flat black,
never pure white.

### App-level semantic tokens (`src/styles/theme.css`)

`tokens.css` is generated upstream, so the app owns a thin semantic layer on top of it.
These exist so the Lobby carries **no theme-breaking color literals**, and they track
the active theme automatically:

| Token | Definition | Use |
|---|---|---|
| `--fg-bright` | `#efe4cc` dark / `#2e2016` light | Headlines — pushed past `--fg` for contrast (brighter on dark, deeper on light). |
| `--hairline` | `color-mix(in srgb, var(--fg) 20%, transparent)` | Default hairline rules / faint borders. |
| `--hairline-strong` | `…40%…` | Hover borders. |
| `--hairline-faint` | `…8%…` | Footer / section dividers. |
| `--scanline` | `rgba(0,0,0,0.06)` dark / `0.04` light | CRT scanline overlay tint. |

The hairlines derive from `--fg` via `color-mix`, so one definition is correct in both
themes — only `--fg-bright` and `--scanline` need a per-theme override.

### Light theme — wired, not shipped

`tokens.css` ships a full `[data-theme="patina-light"]` palette (parchment `#f2e5bc` bg,
ink `#4f3829`, Gruvbox-light role colors). The **Lobby and the body background are now
theme-ready**: every Lobby color resolves to a token, and the body gradient is
token-driven, so setting `data-theme="patina-light"` on `<html>` renders the Lobby
correctly in light. **The arcade cabinet is still dark-only** (it's bespoke CRT/canvas
art — see §1), so light theme is currently a Lobby-only capability; don't ship a global
theme toggle until the cabinet is themed (or scope the toggle to the lobby).

Activation lives in `src/theme.js` (`applyTheme()`, called from `main.jsx`): it reads
`localStorage["ampactor_theme"]` and applies the attribute; dark (no attribute) is the
default. Nothing writes that key yet. **Preview light now:**
`localStorage.setItem("ampactor_theme","patina-light"); location.reload()`.

`resume.html` is its own separate light/print theme (white `#fff`, teal `#0089a3`),
intentionally divorced from the CRT world for ATS + print.

### Usage rules

- **One spotlight per view.** Cyan is the accent of last resort — CTA, the two glowing
  hero words, the active item. If everything glows, nothing does.
- **Text is parchment `#d4be98`, not white.** Headlines may go slightly brighter
  (`#efe4cc`). Never `#fff` on the dark surfaces.
- **Per-project color is identity:** each project owns one accent (card border-top,
  icon, title). Derive tints with hex-alpha suffixes: `${color}08` fill, `${color}26`
  border, `${color}66` hover-border, `${color}22` glow.

---

## 4 · Typography

**Three monospace faces, each with one job. No sans, no serif, anywhere in the app.**

| Token | Font | Used for |
|---|---|---|
| `--font-arcade` | **Press Start 2P** | Section labels, wordmark, kicker eyebrows, cabinet chrome. ALL-CAPS, wide tracking, **tiny** (8–11px). Never body text. |
| `--font-display` | **Share Tech Mono** | Headlines, project titles, CTAs, data readouts. The "voice" font. |
| `--font-body` | **JetBrains Mono** | Prose, descriptions, nav, captions. The readable workhorse. |

### Scale (`tokens.css`)

`xs 10` · `sm 11` · `base 13` · `md 14` · `lg 16` · `xl 20` · `xxl 24` (px). Headlines
go responsive beyond the scale: hero is `clamp(30px, 6.5vw, 54px)`.

### Tracking

- Wordmark: `--tracking-brand-wordmark` `0.08em` (lobby pushes to `0.2em` for the
  spaced-out arcade wordmark).
- UI labels / section labels: `0.04em`–`0.3em` (the wider, the more "chrome").
- Body / code: `0em`.

### Rules

- **Press Start 2P is decoration, never content.** It's 8–11px, all-caps, heavily
  tracked. Reading more than ~3 words of it is a smell.
- **Headlines are Share Tech Mono at `fontWeight: 400`** — the weight comes from size
  and glow, not bold. The only "bold" moments are inline `fontWeight: 600` spans that
  tint a lead-in phrase (e.g. "Hard systems —" in cyan).
- **Body is JetBrains Mono, `line-height: 1.5–1.65`**, max line length ~580–70ch.

---

## 5 · Motion & Glow

### Durations & easing (`tokens.css`)

`instant 0` · `fast 150ms` · `normal 300ms` · `slow 600ms` · `crawl 1400ms`.
Easings: `standard` `cubic-bezier(.4,0,.2,1)`, `enter`, `exit`, and `spring`
`cubic-bezier(.34,1.56,.64,1)`.

### Glow (the phosphor signature)

Pre-baked box-shadow tokens: `--glow-phosphor-tight/-wide`, `--glow-amber-*`,
`--glow-verdigris-tight`, `--glow-coral-tight`. The cyan bloom is the brand's
fingerprint — `text-shadow: 0 0 20px rgba(0,229,255,0.45)` on the hero words,
`drop-shadow` on the A-mark, `box-shadow` blooms on hover.

### Interaction motion (Lobby)

- Links: color fade to cyan, `0.15s`.
- CTA: bg + bloom + `translateY(-1px)` on hover, `0.18s`.
- Cards: `translateY(-3px)` + colored bloom on hover.
- Explore button: bg wash + **letter-spacing widens `0.18em → 0.24em`** on hover (the
  machine "powering up").

### Reduced motion — non-negotiable

Every animated surface honors it. The Lobby kills all transitions:

```css
@media (prefers-reduced-motion: reduce) {
  .lobby *, .lobby-explore { transition: none !important; animation: none !important; }
}
```

The cabinet's `useIntroSequence` supports skip; respect `prefers-reduced-motion` in any
new motion.

---

## 6 · Spacing & Layout

- **Responsive by `clamp()`, not breakpoints.** Page padding
  `clamp(20px, 5vw, 56px) clamp(20px, 5vw, 48px)`; section rhythm
  `gap: clamp(36px, 6vw, 56px)`. The layout breathes with the viewport instead of
  snapping at fixed widths.
- **Single reading column, `max-width: 780px`, centered.** Everything important fits one
  scannable column.
- **Grids auto-fit:** `repeat(auto-fit, minmax(220–260px, 1fr))` for proof and cards —
  reflow without media queries.
- **The scroll-container pattern (load-bearing — the body is `overflow:hidden`):** a
  full-screen surface must be its own scroller, or content below the fold is clipped.

  ```css
  height: 100dvh;           /* not min-height */
  overflow-y: auto;
  display: flex; flex-direction: column; align-items: center;
  justify-content: safe center;   /* centers short content, anchors top when it overflows */
  /* inner wrapper: margin: 0; flex-shrink: 0; */
  ```

- **Radii:** 6px (buttons/CTAs), 8px (cards), 10px (the big explore panel).
- **Borders are hairline + low-alpha:** `1px solid rgba(...,0.2–0.4)`, often with a
  brighter `border-top` as a project's color accent.

---

## 7 · Iconography & Marks

- **A-mark** (`AMark` in `Lobby.jsx`): an "A" drawn as two cyan strokes with a small
  sine-wave squiggle through the crossbar and two serif feet — the "amp/wave" idea.
  SVG, cyan, `drop-shadow` glow. The only logo.
- **Wordmark:** `AMPACTOR` in Press Start 2P, cyan, `letter-spacing: 0.2em`, glow.
- **Glyph language — Unicode symbols, not icon fonts.** Projects and proof points each
  carry a single evocative glyph: `☀` (compiler/star), `♫` (DSP), `◈` (security),
  `⚡` (perf/ML), `⚔` (netcode), `⚒` (forge), `⦾` (browser), `⬡` (trading), `∿` (synth),
  `◎` (field), `▸` (run/enter). Keep new glyphs in this terse, mono-friendly register.

---

## 8 · Components

### Lobby (the conversion surface)

| Component | Spec |
|---|---|
| **Header** | A-mark + `AMPACTOR` wordmark left; nav (`GITHUB · LINKEDIN · RÉSUMÉ · EMAIL`) right, Press-Start-tiny, muted → cyan on hover. |
| **SectionLabel** | Press Start 2P 8px, `0.3em` tracking, `rgba(0,229,255,0.45)`, followed by a 1px hairline rule that fills remaining width. The repeating "chapter heading." |
| **Hero** | Kicker (name, arcade font, muted) → `<h1>` Share Tech Mono `clamp(30,6.5vw,54)` with two glowing cyan words → subhead (body, parchment, max 580) → status line (`●` verdigris dot + text). |
| **Primary CTA** | `Let's talk →` Share Tech Mono, cyan text on `rgba(0,229,255,0.07)`, `1px` cyan-40% border, soft bloom. Links to `MAILTO` (prefilled subject). |
| **Ghost button** | Résumé / Book-a-call. Muted text, faint parchment border, no fill. (Book-a-call is hidden until `CONTACT.scheduler` is set.) |
| **Proof item** | Cyan glyph + parchment line, in an auto-fit grid. Lead with the live/paying proof. |
| **Tier paragraph** | "Hard systems —" (cyan 600) / "Everyday delivery —" (amber 600) + parchment body; italic muted note. |
| **Flagship card** | `<a>` to `p.live` if set, else GitHub. `${color}08` fill, `${color}26` border, 2px `border-top`. The accent (icon, title, border-top, CTA) is **muted toward the patina** — `color-mix(in srgb, ${color} 55%, var(--color-muted))` — so the three flagship hues harmonize instead of clashing. CTA reads **"Try it live →"** for live products, else "View source →". Hover: lift + colored bloom (raw `${color}`). |
| **ProductPreview** | A framed live-product screenshot (`SEE IT LIVE`) linking to the live product. Reveals itself only once `public/scry-preview.png` loads — hidden until the asset exists, so no broken image ships. |
| **Explore panel** | Full-width button, `▸ EXPLORE THE FULL ARCADE` + meta line. Mounts the cabinet. Hover widens letter-spacing. |
| **Footer** | Location left, email right, hairline top border, comment-color. |
| **Scanline overlay** | Fixed, `pointer-events:none`, `opacity 0.4`, 2–3px repeating-linear-gradient. The calm version of the CRT texture. |

### Cabinet (the arcade — bespoke, change with care)

- **Cartridge / program cards** in the `select` screen — the project grid as game
  cartridges, each in its project color.
- **SYS/READOUT detail panel** (`DetailScreen.jsx`) — `outcome` lead line (project
  color, 600) above the engineer's readout (`highlights`, `operatorNote`, `stack`).
- **Boot sequence** (`useIntroSequence`, GSAP) — cinematic power-on; skippable;
  `localStorage 'ampactor_visited'` jumps returning visitors past it.
- **Insert-coin mechanic**, **ambient hum** (`useAmbientHum`), **hidden games**
  (`HIDDEN_PROJECTS`: synth, coherence field, tunnel shooter) — the reward layer.
- **"‹ LOBBY" back control** — discreet, top-left, returns to the front desk.

---

## 9 · Content Model

Each project (`src/data/projects.js`) is the real résumé unit:

```js
{
  id, title, subtitle,            // identity
  color, icon,                    // per-project visual identity
  github, live, lang, stack, tags, // facts (live = deployed product URL, optional)
  outcome,                        // §2 register 1 — buyer-facing, lobby + résumé
  tagline,                        // §2 register 2 — ALL-CAPS arcade hook
  desc, highlights, operatorNote, // §2 register 3 — engineer's proof (cabinet)
  status, category,
}
```

- `FLAGSHIP_IDS` in `profile.js` picks the three lobby cards (currently
  `tokensafe, mentl, sonido` — live/paying product first).
- `HIDDEN_PROJECTS` are the easter-egg interactive toys, not part of the pitch.

---

## 10 · Information Architecture

```
/                 → App → Lobby (default)   ⟶  "Explore" mounts the Cabinet
/#arcade          → App → Cabinet (deep-link straight to the arcade)
/resume.html      → standalone static, zero-JS, print/ATS theme
```

Returning visitors still land on the Lobby (fast); the cabinet's `ampactor_visited`
flag only governs whether the boot sequence plays.

---

## 11 · Accessibility

- `prefers-reduced-motion` honored everywhere (§5).
- `eslint-plugin-jsx-a11y` is in CI — alt text, anchor content, labels.
- Decorative SVG/scanlines are `aria-hidden`; controls have `aria-label` (e.g. the
  back-to-home button).
- External links: `target="_blank"` + `rel="noopener noreferrer"`.
- Contrast: parchment-on-charcoal and cyan-on-charcoal both clear AA for the sizes used;
  keep muted/comment text at ≥13px.

---

## 12 · Do / Don't

**Do**
- Lead with the buyer outcome; keep the numbers one layer deeper.
- Spend cyan like spotlight — one focal glow per view.
- Keep everything monospace; let type, glow, and spacing do the work.
- Make every full-screen surface its own scroll container.
- Honor reduced-motion in any new animation.

**Don't**
- Don't introduce a sans/serif font, pure white text, or flat-black backgrounds.
- Don't let a generator re-skin the bespoke cabinet (GSAP/canvas/audio) — explore the
  Lobby instead.
- Don't hand-edit `tokens.css` or let `profile.js` / `resume.html` / `index.html` drift
  out of sync.
- Don't anchor the pitch low or bury the "available now" status.
- Don't add marketing adjectives. Concrete nouns and numbers only.

---

## 13 · Changing the System

- **Tokens** (color/type/motion): edit the upstream `ampactor-theme` YAML and re-run
  `export/to-css.sh` → regenerates `public/tokens.css`. Never edit the CSS directly.
- **App-level semantics / theming** (`src/styles/theme.css`): the hairline / bright-fg /
  scanline tokens and the `[data-theme="patina-light"]` overrides. Add new semantic
  colors here (derived from the generated palette), not as literals in components.
  Activation seam is `src/theme.js`.
- **Copy** (identity/positioning/proof): edit `src/data/profile.js`, then mirror the
  same words into `public/resume.html` and `index.html` (`<title>`, meta, JSON-LD,
  `<noscript>`). They cannot import JS — sync by hand.
- **Work**: edit `src/data/projects.js`; pick lobby flagships via `FLAGSHIP_IDS`.
- **Verify**: `npm run lint && npm test && npm run build` before deploy. CI publishes
  `dist/` (including `public/`) on push to `main`.

---

## 14 · AI Handoff Brief

_Paste this block into Claude Design (or any AI design tool) as the brand context.
Scope any generation to **the Lobby / a landing surface** — not the bespoke arcade._

> **Brand:** Ampactor Labs — portfolio of Morgan Espitia, systems engineer.
> **Concept:** "Patina Dark" — a worn arcade CRT rendered with engineering precision.
> Phosphor glow, scanlines, monospace-only, warm parchment text on a dark radial.
> Confident, terse, buyer-framed voice; lead with outcomes, numbers one layer deeper.
>
> **Palette (dark only):** background radial `#1d2021 → #2a2826 → #0f0e0d`;
> primary text parchment `#d4be98` (never white); hero accent **electric cyan
> `#00E5FF`** (use as a single spotlight per view — glow, CTA, one or two hero words);
> secondary accent amber `#d8a657`; muted text `#a89984`; faint `#5a524c`; borders
> umber `#45403d`. Per-card identity colors allowed (magenta, yellow-green, coral).
>
> **Type — three monospace faces, no sans/serif:** Press Start 2P (tiny 8–11px,
> ALL-CAPS, wide-tracked labels/chrome only); Share Tech Mono (headlines, titles, CTAs,
> data — weight 400, size+glow carry emphasis); JetBrains Mono (body/prose,
> line-height 1.5–1.65).
>
> **Layout:** single centered column, max-width 780px; responsive via `clamp()` not
> breakpoints; auto-fit grids; radii 6/8/10px; hairline low-alpha borders, brighter
> colored `border-top` accents. Soft cyan/amber glow on hover; honor
> `prefers-reduced-motion`.
>
> **Lobby sections, in order:** header (A-mark wordmark + nav) → hero (kicker name →
> "Low-level Rust. Full-stack web." with "Rust" glowing cyan → tiered subhead →
> `● Available now` status) → primary CTA "Let's talk →" + Résumé ghost button →
> PROOF strip (4 outcome lines, live/paying first) → WHAT I TAKE ON (hard tier in cyan
> + everyday tier in amber) → SELECTED WORK (3 flagship cards) → EXPLORE THE FULL ARCADE
> panel → footer. Each section opens with a Press-Start-2P micro-label + hairline rule.
>
> **Goal:** a calm, ~10-second-skimmable conversion surface that gets a buyer/recruiter
> from landing to "Let's talk" — distinctly of the CRT world but quieter than the
> arcade. Don't redesign the arcade itself; don't add a sans-serif; don't use white
> text; don't bury the "available now" status or the email CTA.

When a direction is chosen, export it and bring it back to the repo for
implementation against the real `tokens.css` / React components — the export is an
*input to* implementation, not a drop-in replacement for the Vite/React app.
