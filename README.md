# ampactor.dev

A portfolio site that shows Morgan Espitia's projects as an arcade cabinet and generates each project's page from its README. It is a multi-page React 19 and TypeScript app on Vite, deployed to GitHub Pages, with a commit log built from git, a case-study page measured on the production build, and a printable résumé rendered from one JSON file.

**Status: shipping.** Live at https://ampactor.dev; the Lighthouse numbers on `/craft/` date from the last `npm run audit`, which is run by hand.

Live: https://ampactor.dev

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev            # vite, multi-page: /, /arcade/, /receipts/, /craft/
```

The site is an arcade cabinet, and the cabinet is the whole page. It opens on
its title card (the name, the trade, two lines of Morgan's own, PRESS START);
START shows the select screen, where each project is a cartridge and three
operator programs at the end of the list hold the rest of a portfolio: HOW TO
PLAY (the controls), HIGH SCORES (the commit ledger) and CREDITS (the career
roll). The résumé, GitHub and LinkedIn are pills on the select screen's
header. Escape or the browser's Back button steps back the way you came, down
to the title card. On a first visit the machine powers on and prints its BIOS
before the title card, about two and a half seconds in all, and any key or tap
skips ahead; after that it lands where the URL points. Click the coin slot on
the cabinet to unlock three hidden programs. One of them is TUNNEL_RUN, a
vector shooter with a global top-10 leaderboard that runs with no server.

The other commands:

```bash
npm run build          # sync READMEs, sync the commit data, render the résumé, vite build
npm run sync:readmes   # rebuild src/data/readme-content.generated.json from the projects' READMEs
npm run readmes:report # how each project's README measures against docs/README-STANDARD.md
npm run readme:check -- path/to/README.md   # check one README before it is pushed
npm run sync:receipts  # rebuild the commit data from git
npm run resume:build   # src/data/resume.json → public/resume.html
npm run audit          # Lighthouse (median of 5), test counts and weights → src/data/audit.json
```

## How it works

The pages:

- `/`: the cabinet on its title card (attract mode): the name, the trade, then
  the cartridges in turn and the high-score table
- `/arcade/`: the cabinet's select screen; `/arcade/#<project id>` opens a
  project, `/arcade/#how-to-play`, `#high-scores` and `#credits` the operator
  programs
- `/receipts/`: the commit log, every public commit with filters, charts and
  CSV/JSON export; the view is stored in the query string, so any view can be linked
- `/craft/`: how the site is built, with numbers that `npm run audit` measures
  on the production build
- `/resume.html`: the résumé, a static printable page generated from one JSON file
- `/comma/`, `/slot/`, `/apapacho/`: small apps served from `public/`; the
  other hosted projects deploy from their own repositories to `ampactor.dev/<repo>/`

### The cabinet as the page

The console fills the viewport (`min(900px, 100vw)` × `100dvh`) and stands in
a dark backdrop; there is no page around it to scroll. The URL is the source
of truth: `src/arcade/zoom/arcadeRoute.ts` resolves the route (`/` the title
card, `/arcade/` the list, `/arcade/#<id>` an open program),
`useArcadeHistory` owns the History API, and the cabinet requests navigation
through intents instead of calling it directly, so Back always walks program →
list → title card. The boot is the machine's own business and not a route: a
first visit (nothing in `localStorage`) powers on and prints the BIOS, then
lands where the URL points. `docs/DESIGN-SYSTEM.md` covers the design.

### Shared code

Each page is its own HTML file, because GitHub Pages has no SPA fallback, and
all of them load the same `shell` chunk: React, the pages' frame, the
theme and the formatters. `vite.config.js` defines it with a Rolldown
`codeSplitting` group. Without it, the automatic splitter gives any module
shared by some pages but not all a chunk of its own; adding `/craft/` once
added a request to the home page and 160 ms to its largest paint on
Lighthouse's simulated phone.

### Project cards from READMEs

Presentation fields (color, icon, subtitle, highlights) live in
`src/data/projects.js`. Content comes from each project's README at build
time, field by field, when that field passes `docs/README-STANDARD.md`: the
first sentence of the lead becomes the card, the lead becomes the cabinet
page, and the status line and the first paragraph of Limitations become the
status and the known-limitations note. `scripts/sync-readmes.mjs` fetches the
READMEs from GitHub without credentials; when the network is down it keeps the
last synced content. A project whose source is private (`github: null`) keeps
its hand-written text. `docs/ADDING-A-PROJECT.md` has the two commands for
adding a project.

### The commit log

`/receipts/` is a small data app over the commit history of the public
repositories. `scripts/sync-receipts.mjs` clones every public repository in
`projects.js` (plus this one) bare into `.cache/receipts/` and reads
`git log --shortstat`, which gives exact additions, deletions and file counts
for every commit with no token and no rate limit. It writes
`public/receipts/data.json` (about 1 MB), 256 small shards of message bodies
under `public/receipts/bodies/` (one is fetched when a commit is opened), and
`src/data/receipts.summary.json` for the home page. When the network is
unavailable it keeps the committed snapshot; `--strict` fails instead, and
`--report` prints per-repository counts. In the browser,
`src/receipts/ledger.ts` is the pure model (filter, aggregate, sort, total,
CSV/JSON export), `urlState.ts` is the codec between the view and the query
string, and the tiles, the three SVG charts, the virtualized TanStack table and
the export form all read one filtered list, so they always agree.

### The leaderboard, with no server

`public/tunnel-leaderboard.json` is the entire database. When a run qualifies
for the global top 10, the game links to a prefilled GitHub issue titled
`[tunnel-run] AAA 12345`. A workflow (`.github/workflows/leaderboard.yml`)
validates the title, merges the score into the JSON with
`scripts/merge-leaderboard.mjs`, commits the file, closes the issue, and
dispatches a Pages deploy, so every high score is a commit. Submitting needs a
GitHub account; without one the board is read-only and scores stay in
localStorage. The closed issues double as a visitor log: every submission is
labeled `leaderboard` and carries the player's GitHub handle. At score 1500
the tunnel summons ANOMALY, a boss that escalates each run it loses; append
`?boss=200` to `/arcade/` to fight it early.

### The résumé

Edit `src/data/resume.json`; `npm run resume:build` renders
`public/resume.html`, and `npm run build` does it too. The timeline on the
home page reads the same file.

## Benchmarks

`npm run audit` serves the build and runs Lighthouse 12.8 five times per page,
each in a fresh profile with mobile simulated throttling, so the home page is
measured as a first visit including its opening animation. It keeps the median
run, counts the unit tests and browser test runs, measures what each page
ships, and writes `src/data/audit.json`, which `/craft/` displays with the
date. The last run, 2026-09-25, on one laptop:

| Page         | Performance | Accessibility, best practices, SEO | Largest paint | CLS | JS (gzip) |
| ------------ | ----------- | ---------------------------------- | ------------- | --- | --------- |
| `/`          | 96          | 100 / 100 / 100                    | 2.4 s         | 0   | 130 KB    |
| `/receipts/` | 96          | 100 / 100 / 100                    | 2.3 s         | 0   | 117 KB    |
| `/craft/`    | 98          | 100 / 100 / 100                    | 2.1 s         | 0   | 70 KB     |

The cost is the cabinet: the home page ships the most JavaScript and paints
its largest element last, because a first visit powers the machine on and
prints the BIOS before the title card.

## Project layout

```
src/
  main.tsx, App.tsx        the cabinet page and its router
  arcade/                  the cabinet (JavaScript): the screens (title card, boot,
                           select, cartridge, operator programs), the panel, the
                           game; zoom/ holds the URL scheme and the history
  receipts/                the commit log page: pure data model, URL state, charts,
                           the virtualized table, the drawer, the export form
  craft/                   the case study page
  ui/, lib/, styles/       the pages' frame and the A-mark, theme, tokens, formatting
  data/                    projects.js, profile.js, site.js (each page's <head>),
                           resume.json, receipts.summary.json, audit.json,
                           readme-content.generated.json
scripts/                   sync-readmes, check-readme, add-project, sync-receipts,
                           build-resume, render-og, axe-report, audit, merge-leaderboard
docs/                      README-STANDARD.md, ADDING-A-PROJECT.md, DESIGN-SYSTEM.md
public/                    static files, the hosted apps, the leaderboard, the résumé
e2e/                       the Playwright specs
```

## Deploy

GitHub Pages. A push to `main` deploys through `.github/workflows/deploy.yml`
after lint, typecheck and the unit tests pass, and the same workflow runs
every night at 09:17 UTC, so the cards never drift more than a day behind a
project's README. Projects that deploy from their own repositories are served
at `ampactor.dev/<repo>/` by GitHub Pages under the organization's custom
domain.

## Testing

```bash
npm test               # vitest (jsdom)
npm run e2e            # playwright against the production build, desktop + phone
npm run lint           # eslint: the JS arcade, the TS pages, scripts, e2e
npm run typecheck      # tsc --noEmit
```

The unit tests cover the commit log's model, URL codec, chart scale and
export schema, the project data, the arcade's route and history, cabinet
state, screens and boss, the formatters and the theme, and the pages'
rendering. The browser tests cover the title card, the boot, the list and the
operator programs, the history, the commit log, the craft page, continuity between pages and
behaviour on a slow network, on a desktop and a phone profile, with an axe
accessibility scan. `npm run audit` counted 243 unit tests and 68 browser
test runs on 2026-09-25. CI (`.github/workflows/ci.yml`) runs lint, typecheck,
the unit tests, the build and the browser tests on every pull request and on
pushes to other branches. Not tested: the Lighthouse numbers (measured by hand
with `npm run audit`), the leaderboard workflow (exercised only by real
submissions), and the README sync against the live repositories (the build
keeps the last synced content when a fetch fails).

## Limitations

The site is only as current as its last build: project cards come from the
READMEs at build time, so a README change appears after the next push to
`main` or the nightly deploy, and a project whose repository is private keeps
its hand-written card because the sync fetches READMEs without credentials.
GitHub Pages has no server, so every page is its own HTML file, the commit log
is a 1 MB JSON download that the browser filters itself, and the leaderboard
accepts scores only through GitHub issues. The Lighthouse numbers on `/craft/`
are a snapshot from the date shown, measured on one laptop's simulated phone
profile.

## License

No license chosen yet.
