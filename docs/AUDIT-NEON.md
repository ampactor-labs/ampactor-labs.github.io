# The neon audit

A UI, UX and aesthetics audit of ampactor.dev, October 2026. The brief, in
Morgan's words: make the cabinet less "Fallout hacking terminal" and more
Polybius, Pit Viper, Hyper Light Drifter, neon post-punk; the reference image
is the Ultracode option in the Claude app, a violet-to-purple gradient with a
lit pixel grid in bands, lilac highlights and a small pixel character.

How it was made: four readers inventoried the code, ten finders each worked
one dimension (palette, typography, CRT effects, motion, chrome, screens,
pages, phones, accessibility and performance, sound) and returned four to
eight proposals with file and line references, and three style tiles were
drawn as self-contained HTML (`docs/audit/tiles/`). The per-finding refuters
were cut for cost, so this document is the sceptical pass: the proposals
below are the ones that move the site toward the target and keep what must
survive; the ones dropped are in the appendix. Every contrast ratio in the
token section was recomputed here with the WCAG 2.x formula.

What must survive, from the brief: the cabinet as the whole page, the idiom
(PRESS START, INSERT COIN, the panel, HIGH SCORES, CREDITS, NOW SHOWING),
the power-on in about 2.5 s, the attract loop, Back and Escape, keyboard
play, the coin slot and its hidden programs, TUNNEL_RUN, text at WCAG AA,
the reduced-motion paths, no third-party requests, the phone layout down to
375×548, and the copy rule in `CLAUDE.md` (paint changes, no new sentences).

## 1. What reads as "terminal" today

The short version: the site is painted as a photograph of a dying VT220,
and every layer of that photograph is a choice that can be swapped.

**The ground and the text.** Parchment `#d4be98` on charcoal `#1d2021`,
dim `#2a2826` and void `#0f0e0d`, with muted `#a89984` and comment
`#5a524c` as the quieter tiers (`public/tokens.css:15-28`). These are an
editor theme's greys (gruvbox-material) worn as a brand. The room radial is
painted three times with the same literals (`src/arcade/styles/stage.module.css:27-32`,
`src/styles/global.css:41-48`, `public/404.html`). Comment grey on dim is
1.92:1 and is used as text for the marquee, the CO-OP line and the footers.

**Amber as the voice, green as the halo.** Amber `#d8a657` is what the
machine says: PRESS START, READY., INSERT COIN, the three operator programs,
the game's prompt panel (11 `var()` sites plus 13 `rgba(216,166,87)` and
two private copies in `TunnelGame.jsx:32` and `SynthEngine.jsx:4`). Under
every character on the tube sits a verdigris text-shadow
(`src/arcade/styles/crtStyles.js:23`), so parchment, cyan and every
cartridge's neon glow faintly green. Amber on charcoal with a green phosphor
halo is the RobCo terminal exactly.

**Eleven sheets of monitor damage.** The tube is assembled from static dark
scanlines above the text, a rolling sync bar, a glass reflection, fake
barrel curvature, feTurbulence grain, a 50 % black vignette, a 1 % cyan grid
nobody can see, a 14 s opacity flicker, and the four-stop phosphor shadow
(`src/arcade/ArcadeStage.jsx:139-215`, `crtStyles.js:20-25,40`). Three of
them darken the text they sit over. The RGB split the target wants exists
as two dead SVG filters (`src/arcade/CrtEffects.jsx`) that nothing uses.

**Type.** Share Tech Mono (the default face of every "hacker UI" template)
speaks at display size; Press Start 2P is rendered at 5, 6, 7, 9, 11, 13
and 15 px, off its 8 px grid, with 0.1 to 0.3 em of tracking that breaks
the cell rhythm into grey mush; the BIOS is hand-padded dot leaders with a
block cursor; prose is monospace; 65 `letterSpacing` sites carry twelve
different values; labels are faded with alpha to read "worn".

**Motion.** The A-mark warms up through eight random opacity keyframes, the
tube ignites from a scanline aperture, every frame enters with a VHS
tracking glitch (skew plus hue-rotate), screens change through a 100 ms
blank and a Material fade-up, the coin fires a full-tube tinted flash, and
the idle layer is a travelling scanline. Every verb is "bad signal".

**The chassis.** Umber `#45403d` borders, brown d-pad plastic, a
coral-brown B, a teal-navy A, a sepia panel gradient: a beige terminal
case. The halo is cyan at 0.07 alpha, a tint rather than a light.

**Sound.** Two-note square beeps for enter and back (the DOS OK/error
pair), three raw sawtooths for the coin, nothing between presses although
the hook is named `useAmbientHum`, three separate AudioContexts, no bus, no
limiter, no space. A terminal bell.

**The pages.** A blurred glass sticky header, cyan phosphor bloom on the
wordmark, the same charcoal radial as the cabinet, and with the lights on
a gruvbox-light parchment with no brand effect at all. The 404 is a third
hand-copied palette.

**Phones.** At 375×548 the panel is 28 % of the screen as sepia plastic
with 30 px keys and 5 px labels; the select screen shows two rows under a
110 px sticker and a 42 px marquee strip; the readout's SOURCE pill is
clipped off the tube by up to 22 px; most touch targets are 20 to 32 px.

## 2. Three directions, and the recommendation

The tiles are in `docs/audit/tiles/` (open them from a served copy of the
repo so the self-hosted fonts resolve, or open the screenshot beside each one:
`polybius.jpg`, `drifter.jpg`, `pitviper.jpg`).

**POLYBIUS.** A black-violet cabinet, the wireframe tunnel coming up through
the tube and onto the room floor, magenta as the machine's voice, cyan
kept for the name and the mark with a magenta/blue chromatic split, every
accent blooming in three stops. Strongest energy; the backdrop, the
power-on and the game are already halfway there. Weakest on the paper
pages (the tunnel does not belong on a résumé) and the most paint per
frame if the bloom is done with filters.

**DRIFTER.** Indigo-to-violet room, a lit purple pixel-grid floor, a dither
band under the title card, mist text with soft magenta bloom, teal signage,
magenta PRESS START and lit row, one ember pixel figure; CRT noise and the
amber phosphor gone, scanlines kept at a whisper. This is the reference
image in cabinet form, it is the quietest on contrast (lilac and mist on
indigo clear AA by a wide margin), and it costs the least: gradients and
grids are static paint.

**PIT VIPER.** Hot magenta, electric purple, cyan, lime, a sunset band
behind the title card, a grid floor, chrome and stripes on the bezel.
The loudest and the most fun in a screenshot, and the hardest to keep
readable: on the bright stripes and the sunset band only white and lime
pass 4.5:1, and eleven of the twenty-two project colours fail even 3:1 on
electric purple `#6b3fd6`.

**Recommendation: Drifter leads, Polybius powers the moments, Pit Viper is
one motif.** The ground, the text, the chassis, the pages and the light
theme take the Drifter palette (indigo, violet, lilac, mist, magenta), which
is the reference image and the safest for contrast. The tunnel, the
power-on, the coin, the game and the bloom take the Polybius treatment
(additive vectors, magenta/cyan split, light behind the letters). Pit
Viper's sunset band becomes a single reusable element, a 3 px
cyan-to-violet-to-magenta rule under HIGH SCORES, category headers and the
readout signs, and the striped bezel is left on the tile. Cyan stays the
mark and the name: it keeps every icon, the A button and the social card
valid, and it clears AA on every dark ground.

## 3. The token set

Dark cabinet grounds (text sits only on the first three):

| token | value | use |
|---|---|---|
| `--void` | `#0a0716` | tube bottom, insets, the darkest shadow |
| `--indigo` | `#15102e` | the room, the tube ground |
| `--dusk` | `#221a45` | chassis, cards, raised surfaces |
| `--violet` | `#3b2b7d` | bezel, borders, hairlines (never text) |
| `--purple` | `#6b3fd6` | the lit grid and active fills (never under text) |
| `--band` | `#2b1a5e` | the title-card band's dark end; text may sit here |
| `--band-bright` | `#4a2ca0` | the band's bright end; only mist and cyan on it |

Text and accents, with the ratio against void, indigo, dusk and the band:

| token | value | role | void | indigo | dusk | band |
|---|---|---|---|---|---|---|
| `--mist` | `#ece6fb` | primary text, never white | 16.4 | 15.1 | 13.3 | 12.2 |
| `--lilac` | `#b9a6e8` | muted text, d-pad glyphs, grid line | 9.2 | 8.5 | 7.4 | 6.9 |
| `--faint` | `#8f7fb8` | footers, ranks, the marquee (not on the band) | 5.6 | 5.2 | 4.5 | 4.2 |
| `--cyan` | `#00e5ff` | the A-mark, the name, A, the ship, the tunnel | 12.9 | 11.9 | 10.5 | 9.7 |
| `--magenta` | `#ff2fd2` | the machine's voice: PRESS START, READY., INSERT COIN, the lit row | 6.3 | 5.8 | 5.1 | 4.7 |
| `--magenta-lt` | `#ff5ce1` | magenta at 7 to 9 px, where 4.5:1 needs more room | 7.5 | 6.9 | 6.1 | 5.6 |
| `--mint` | `#00ffd0` | OK, status, lasers | 15.4 | 14.2 | 12.5 | 11.5 |
| `--gold` | `#ffb800` | the coin and only the coin: slot, credit, rank 1 | 11.5 | 10.6 | 9.3 | 8.6 |
| `--ember` | `#ff8a5c` | the one warm accent: deployed, COMBO, the pixel figure | 8.6 | 7.9 | 7.0 | 6.4 |
| `--danger` | `#ff3b7a` | danger text, B's label, game over | 5.8 | 5.4 | 4.7 | 4.4 |
| `--hot` | `#ff2266` | strokes and glows only (boss, B's ring); 4.4 on dusk | | | | |
| `--violet-lt` | `#b388ff` | the quiet accent, the OPERATOR category | 7.5 | 6.9 | 6.1 | 5.6 |

Rules that follow from the numbers: `--faint` never sits on the band;
magenta and danger never sit on `--band-bright` (3.1 and 2.9); nothing
but mist, cyan, mint and gold sits on `--purple`; void ink on a magenta,
cyan, gold or mint pill is 6.3, 12.9, 11.5 and 15.4. Today's pairs for
comparison: parchment on dim 8.1, amber on dim 6.7, comment on dim 1.9.

Light theme (the paper pages only; the cabinet stays dark through
`.cabinet-scope`): paper `#f4f0fc`, ink `#221a3f` (14.5:1), muted
`#5a5078` (6.6), faint `#6b6190` (5.0), accent `#b5176f` deep magenta
(5.6) or violet `#5a2db8` (7.5) for links and the sort mark.

These are the cabinet's semantic tokens, pinned in `.cabinet-scope`
(`src/styles/theme.css:76-92`) so they cannot flip under the light theme.
`public/tokens.css` is generated from the ampactor-theme YAML and should
gain the same four hues upstream; until then the cabinet reads its own
layer. A `src/arcade/palette.js` exporting the same values plus
`alpha(hex, a)` replaces the 140 hex literals in `src/arcade` (43 of them
`#00E5FF`) and the three private palettes in `SynthEngine.jsx`,
`TunnelGame.jsx` and `TunnelCanvas.jsx`.

## 4. The change list

Impact is 1 to 5 toward the target; effort is S, M or L.

### The tube (`src/arcade/ArcadeStage.jsx`, `src/arcade/styles/crtStyles.js`)

- **Five layers instead of eleven** (5, M). One ground element paints the
  indigo gradient, the lit grid (8 px cells on desktop, 6 px under 480 px,
  lilac at 0.11) and four brightness bands; the cartridge bleed stays; one
  dithered indigo shadow under a mask replaces grain, glass, curvature and
  the vignette; the glitch flash and the coin announce stay conditional.
  Everything that darkens sits below the content (z < 50). Delete the
  static scanlines, `.scanline-bar`, `.crt-glass`, `.crt-curvature`,
  `.crt-noise`, the 1 % `.crt-grid` and the 14 s flicker.
  `ArcadeStage.jsx:139-215`, `crtStyles.js:20-25,40`.
- **Bloom in the text's own colour** (5, M). Replace the verdigris
  `.crt-phosphor` shadow with two tiers, `--bloom-text` (one 4 px stop of
  `currentColor` at 35 %) on nodes from 10 px up and `--bloom-signage` (6 px
  at 60 % plus 24 px at 28 %) on the dozen signage nodes. A cartridge's
  neon then blooms in its own colour by inheritance, and the thirty
  hand-typed `textShadow` props go. `crtStyles.js:23`, the screens.
- **Chromatic split in CSS, not SVG** (3, S). Delete `CrtEffects.jsx` and
  its mount; a `--fringe` text-shadow pair (magenta left, cyan right, 1.5
  px) on signage and the A-mark plate is the Polybius split at paint time.
- **Canvas bloom as a second additive pass** (3, M). The tunnel already
  strokes each ring sharp then wide under `lighter`; the game's
  `shadowBlur` calls become the same two passes, which is cheaper and is
  the Polybius trail. `TunnelGame.jsx:285-286,344-348,394-403,712-713`.

### Palette and chrome (`public/tokens.css`, `src/styles/theme.css`, `src/arcade/components/Cabinet.jsx`)

- **The ground and the text** (5, M). The tokens in section 3; the room
  radial becomes indigo 0 % → void 100 % and is painted once from tokens
  (delete the two literal copies); the tube radial dusk → void; theme-color
  `#15102e`. `e2e/arcade.spec.ts:148-151` pins the console background and
  must take the new value. `tokens.css:15-28`, `theme.css:14-16,76-92`,
  `stage.module.css:27-32,43`, `global.css:41-48`, `site.js:154`.
- **Magenta as the voice** (5, M). Every amber site becomes magenta
  (PRESS START, READY., SELECT PROGRAM's glow, the lit row, INSERT COIN's
  text, rank 1 on HIGH SCORES), teal and verdigris become mint for OK and
  status, gold is tokenised for the coin (16 `rgba(255,184,0)` sites), the
  OPERATOR category takes `--violet-lt` (`src/data/programs.js:15,29,43`).
- **The chassis** (4, M). Console `#0a0612`, panel gradient
  `#16102a → #0c0818 → #050309`, every umber border a 1 px lilac hairline
  at 0.28 with an inset 1 px catch-light, a magenta/violet halo under the
  cabinet and a magenta floor pool. `Cabinet.jsx:45-80,103-106,246`,
  `ArcadeStage.jsx:146-148`, `crtStyles.js:46-47`.
- **The deck as the Ultracode band** (5, S). The panel background becomes
  the violet band with a 12 px lit grid and four brightness steps (hard
  stops, as in the image); labels go lilac; the invisible tube grid is
  deleted. All static gradients, zero runtime cost. `Cabinet.jsx:61-80`.
- **The buttons** (4, M). Black keys with a lilac edge that light magenta
  when pressed, a hot-magenta B, an electric-cyan A, flat rings instead of
  plastic spheres, BACK/SELECT/OPEN at 8 px in full-strength lilac.
  `Cabinet.jsx:41-58,99-108,329-376,385-432`.
- **The tunnel as the light-synth** (4, S). Nearest rings cycle cyan,
  magenta, mint, violet; ring alpha and the glow pass come up from radar
  levels; the ghost A-mark un-hides. `TunnelCanvas.jsx:16-31,141-173`.

### Screens (`src/arcade/components/screens/*.jsx`)

- **The title card on a band** (5, M). The name and the role sit on a
  full-bleed band (`--band` → `--band-bright`) with a pixel-grid
  pseudo-element masked into four brightness steps; the name in mist, flat,
  with the band as its light; the role in ember; the borrowed line below in
  Inter; PRESS START in magenta with the first real bloom on the cabinet.
  The 375×548 fit test in `e2e/home.spec.ts` keeps it honest.
  `AttractScreen.jsx:44-96,295-313`.
- **NOW SHOWING as a cartridge card, HIGH SCORES as a scoreboard** (4, M).
  The frame tinted by the cartridge with its icon in a 64 px tile; the
  scoreboard with the sunset bar, alternating row fills, rank 1 in magenta.
  `AttractScreen.jsx:101-199`.
- **The select list** (4, M). Rows 56 px with a 40 px icon tile and a
  full-height lit bar; category headers as a label plus the sunset bar in
  place of the hairline; the phone sticker in two bands with a horizontal
  chip rail for the contact and the links (one row, 40 px chips); the
  marquee under 600 px becomes a 3 px band in the active row's colour.
  `SelectScreen.jsx:63-201,380-404`.
- **The readout** (4, M). One `Sign` component (label plus sunset bar)
  replaces `SectionLabel`, `SystemScreen`'s `Label` and the category header;
  the header wraps on phones so SOURCE is never clipped; the rail becomes
  two 40 px tiles under 420 px. `DetailScreen.jsx:7-25,68-77`.
- **The BIOS as a lit checklist** (4, M). `BOOT_LINES` entries become
  records (`{ name, verb, ok }`) rendered as a three-column grid with mint
  OK cells; the dot leaders and the block cursor go; the words, the
  cadence and Morgan's sign-off stay. `constants.js`, `BootScreen.jsx`.
  This changes data shape only, not copy.

### Motion (`src/arcade/useIntroSequence.js`, `crtStyles.js`, `useCabinetState.js`)

- **The power-on as a light-synth boot** (5, M). Same constants
  (`BOOT_PATTERN_MS`, `BOOT_LINE_MS`, `BOOT_BEAT_MS`, the tests import them)
  and the same tunnel reveal; the A-mark snaps on once (one rise, one fall)
  instead of flickering eight times; the tube ignites as a stepped band
  wipe left to right (twelve lit bands, like the reference) instead of a
  scanline aperture; the BIOS lines pop on with `steps(1)`; the test card
  is a hard cut. The flicker restart goes. `useIntroSequence.js:90-172`.
- **One entry verb** (4, S). `glitchIn` (skew, hue-rotate, wobble) becomes
  `dashIn`: a 260 ms expo-out dash that leaves magenta and cyan
  after-images, transform and opacity only under 600 px. The three hidden-row
  entries become the same verb with a stagger. `crtStyles.js:10,39,54-56`.
- **Screen changes as a cut and a dash** (4, M). Same-document view
  transitions on the tube (`startViewTransition` around `setScreen`, a
  two-frame cut out, a 220 ms dash in), under
  `prefers-reduced-motion: no-preference` as the pages already do;
  `DetailScreen`'s 100 ms blank goes. `useCabinetState.js:138-175`.
- **The coin as a thing that happens** (4, M). A 120 ms drop on the slit, a
  bloom ring from the slot, then the stamp on the tube, then the rows
  lighting in order, instead of a full-tube tinted flash.
- **The idle layer** (4, M). One slow brightness sweep across the lit grid
  on its own transform layer (off under 600 px and reduced motion) replaces
  the travelling scanline, the tube flicker and the square-wave blinks;
  PRESS START breathes (a sine on opacity and bloom) instead of blinking.
- **A flash budget, written and tested** (3, S). No region over 21,824 px²
  changes luminance by 0.10 more than three times a second; overlay flashes
  capped by colour; the boss's 60 ms death blink becomes 170 ms with a
  narrower alpha swing. The loud part of the register lives in hue and
  bloom, which WCAG 2.3.1 does not count, not in luminance.
  `docs/DESIGN-SYSTEM.md`, `tunnelBoss.js:11-15`.

### Typography (`src/styles/fonts.css`, the screens)

- **Press Start 2P on its 8 px grid, never below 8 px, tracking 0** (4, M).
  A `px()` helper beside `fs()` snaps every Press Start node to 8, 16, 24,
  32 or 40; the 5 to 7 px labels go to 8 or go away; 0.3 em tracking goes
  to 0. Crisp cells are the Drifter pixel; smeared ones are the cheap
  terminal. `useCabinetState.js:185-189`, every Press Start site.
- **Prose in Inter, mono by opt-in** (4, M). `.console` takes
  `var(--font-sans)` (zero new bytes); the README description, the outcome,
  the operator note, the CO-OP paragraph and the credits' lines read in a
  reading face; numbers and readouts keep JetBrains Mono.
- **Three tracking tokens** (3, S). `--track-display`, `--track-ui`,
  `--track-pixel` replace 65 literals.
- **A loud display face** (5, M, decision). Archivo variable width (OFL,
  about 100 KB) as a heavy condensed italic for the name, the row titles
  and NOW SHOWING, with Share Tech Mono retired. The tiles were drawn with
  the four existing faces and already read as the target, so this is the
  one item that costs bytes on the critical path (the home page ships 130
  KB of JS and scores 96). Decide after the palette lands; a 35 KB
  condensed face (Big Shoulders Display) or a 15 KB static instance are the
  lean versions.

### The paper pages (`src/floor`, `src/receipts`, `src/craft`, `public/404.html`)

- **Indigo ground, lilac ink** (5, M). `body` takes a top-to-bottom indigo
  gradient (no radial, no fixed attachment); text tiers from section 3;
  the dead floor CSS (203 lines in `Floor.module.css`) goes with it.
- **The lit grid as the masthead** (4, M). The sticky header paints the
  band and the grid with the four-step mask, CSS only; the footer gets a
  24 px strip of the same; the blurred glass goes.
- **One neon rule, a magenta hand** (4, M). Links, the CTA and the sort
  mark in deep magenta; a 2 px cyan-violet-magenta rule as the header's
  edge, the chapter dividers and the table head; the cyan bloom retired.
  Cyan stays the A-mark and the focus ring.
- **Labels in Inter sentence case** (3, M). The receipts' uppercase mono
  labels become Inter 12 px 500; mono stays for numbers.
- **Lilac paper with the lights on** (3, M). The light theme tokens from
  section 3; the cabinet keeps its dark palette.
- **The 404 through the head plugin** (3, M). Add `404.html` to
  `ENTRIES` so it reads the same tokens instead of a third hand copy, and
  give its tube the band.

### Phones and touch

- **The GPU budget** (5, M). Replace rather than disable: the tube's one
  static paint on every width, no `filter` on the tube layer, bloom as an
  additive stroke pass in the game with DPR capped at 1.5 under 600 px, the
  console hidden (not just faded) during the game so its layers stop
  compositing. `ArcadeStage.jsx`, `crtStyles.js:75-80`, `TunnelGame.jsx`.
- **The deck on a phone** (4, M). Flat lit deck, 36 px keys, 8 px labels,
  the EST line hidden under 480 px; the panel drops from 154 to about 141
  px and the tube gains the difference.
- **44 px targets** (3, S). One `(pointer: coarse)` block: a 44 px hit area
  on the keys and the coin, the pills and chips at 40 px, the footer links
  padded.
- **The game's touch halves made visible** (3, M). During the countdown the
  two halves are washed and labelled STEER and FIRE, then fade.

### Sound (`src/arcade/useAmbientHum.js`, `useTunnelGameAudio.js`, a new `audio/bus.js`)

- **A bus** (4, M). One shared context, a master gain into a compressor, a
  delay send for space. Every note takes a send amount. The test mock in
  `src/test/setup.js` grows first or the hook's try/catch hides failures.
- **START as the one ignition** (5, S). The power-on, the boot and the
  attract loop stay silent; PRESS START plays a 0.9 s swell and a power
  chord instead of a row beep; leaving the arcade fades rather than cuts.
- **A bed** (5, M). Two detuned triangles under a slow lowpass, a noise bed
  for the room's air, listening to the tunnel's speed so the game and the
  boss open the filter; remembered off with SOUND ON / SOUND OFF on the
  panel, in the same idiom as LIGHTS ON / LIGHTS OFF.
- **Sweeps instead of beeps** (4, S). Enter and back become resonant
  filter sweeps keyed by the cartridge; the coin a clink then a chord; the
  game's laser and explosions track the run's speed.

## 5. The plan, in shippable steps

Each step is one PR that builds, passes lint, typecheck, the unit suite
and the browser suite, and ships on its own. The order is chosen so that
no step depends on the display-face decision and the most visible change
lands third.

1. **Tokens.** `src/arcade/palette.js`, the `.cabinet-scope` semantic
   layer, the 140 literals folded in, a Vitest contrast table over every
   (text role, ground) pair, and the `e2e/arcade.spec.ts` pin read from the
   tokens. No visual change. Proof: snapshots unchanged except colour
   strings; the contrast test; axe on the title card and the list.
2. **The ground and the voice.** The palette swap on the room, the tube,
   the text tiers and the chassis; magenta for amber, mint for teal, gold
   tokenised; the 404 follows; the social card re-rendered. Proof: the
   contrast test on the new values; the three Vitest DOM snapshots; axe in
   both themes; screenshots on desktop, Pixel 7 and 375×548.
3. **The tube.** Five layers, the lit grid, bloom by colour, the CSS
   fringe, `CrtEffects.jsx` deleted. Proof: axe (the darkening layers are
   below the text now); a count of composited layers in DevTools before and
   after; `npm run audit` with the thresholds from step 9 on the home page.
4. **Motion.** The light-synth power-on inside the same constants, `dashIn`,
   view transitions on the tube, the coin drop, the idle sweep, the flash
   budget test. Proof: the hook's boot tests unchanged; the first-visit
   browser spec; reduced-motion specs; the keyframe test; the power-on
   filmed at 50 ms.
5. **Chrome and the deck.** The panel band and grid, the buttons, the
   halo, the phone deck, 44 px targets. Proof: the `.cabinet-scope` pin;
   screenshots at 375×548; a touch-target probe in the browser suite.
6. **Screens.** The title band, the cartridge card, the scoreboard, the
   select rows and the phone sticker rail, the readout sign, the BIOS as
   records. Proof: the fit test; the attract and select tests; the
   `README` sync check (the BIOS words are unchanged).
7. **Type.** The 8 px snap, Inter for prose, the three tracking tokens.
   Proof: a test that every Press Start size is a multiple of 8; screenshots
   at DPR 1 and 2. The display face is a separate PR with a byte budget
   attached.
8. **Pages.** The indigo ground, the grid masthead, the neon rule, Inter
   labels, lilac paper, the 404 through the head plugin. Proof: axe on
   `/receipts/` and `/craft/` in both themes; the continuity spec (the
   cabinet-to-ledger transition is still one room); the résumé unchanged.
9. **Sound.** The bus, START, the bed, the sweeps, SOUND ON/OFF. Proof: the
   grown audio mock; the no-AudioContext-on-the-title-card test; a listen.
10. **The gate.** `scripts/audit.mjs` exits non-zero under: performance
    below 95 on any page, LCP over 2,500 ms, TBT over 150 ms, CLS not 0,
    home JS over 135 KB gzipped, fonts over 130 KB on disk. Run before and
    after steps 3 and 7.

## 6. What must not change, and how each step proves it

- **Contrast.** The Vitest table from step 1 runs on every PR; axe runs on
  the title card, the list, the readout and both pages in both themes; the
  rule is that text colour is always a full-strength token and "quieter" is
  done with size, never with alpha.
- **Reduced motion.** The existing specs (the title card holds still, the
  pages cut, the boot still prints) stay; every new keyframe is listed in
  the reduced-motion block or collapsed by `global.css:145-153`.
- **The 2.5 s power-on.** The three constants are unchanged and the hook's
  tests import them; the first-visit browser spec times the question
  appearing; the power-on is filmed at 50 ms after step 4.
- **Phones.** The 375×548 fit test, a new touch-target probe, and
  screenshots on Pixel 7 and iPhone 13 at each visual step.
- **Lighthouse.** The gate in step 10; the home page is at 96 with the
  boot counted as a first visit, and every effect in this plan is static
  paint except the idle sweep, which is compositor-only and off on phones.
- **No third-party requests.** `e2e/network.spec.ts` lists the faces each
  page may fetch; a display face, if adopted, is self-hosted and added
  there.
- **The copy rule.** Nothing in this plan writes a sentence. The BIOS
  change is a data shape; the labels STEER and FIRE and SOUND ON/OFF are
  idiom; everything else is paint.
- **The cabinet is the whole page.** Every change here is inside the
  machine or on the two paper pages beside it.

## Appendix: dropped or deferred, and why

- **Pit Viper's striped bezel and sunset title band as the ground.** On
  the band only white and lime clear 4.5:1 and most cartridge colours fail
  3:1; the band survives as a 3 px rule.
- **Electric purple under text.** `#6b3fd6` is a fill colour: lilac on it is
  2.9:1. The grid and the active fills use it; text never sits on it.
- **Hue-rotate and skew as the entry verb.** The strobe risk and the "bad
  signal" read; replaced by the dash.
- **The whole-tube flicker.** Two luminance dips within 0.56 s on the
  largest region on screen; replaced by the idle sweep.
- **Verdigris anything.** Green phosphor is the terminal; mint is the OK
  colour instead.
- **The display face.** Deferred to its own PR with a byte budget, since
  the tiles read as the target with the four faces already on disk.
- **A radial tunnel on the paper pages.** The pages share the palette, the
  grid band and the rule, not the machine.
