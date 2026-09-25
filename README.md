# ampactor.dev

Source for Morgan Espitia's portfolio site, live at https://ampactor.dev.

The home page shows an arcade cabinet next to the introduction. Clicking the
cabinet zooms it to full screen, where each project can be opened from a menu;
Escape or the browser's Back button returns to the page. On a first visit the
page opens with the cabinet at full screen and zooms out after a few seconds.
Below the cabinet are the projects, a summary of the commit log, a short
section on how I work, and a timeline since 2017.

- `/`: the home page (React 19, TypeScript and Vite; light and dark themes)
- `/arcade/`: the cabinet at full screen; `/arcade/#<project id>` opens a project
- `/receipts/`: the commit log, every public commit with filters, charts and
  CSV/JSON export; the view is stored in the query string, so any view can be linked
- `/craft/`: how the site is built, with numbers that `npm run audit` measures
  on the production build
- `/resume.html`: the résumé, a static printable page generated from one JSON file

Click the coin slot on the cabinet to unlock three hidden programs. One of
them is TUNNEL_RUN, a vector shooter with a global top-10 leaderboard that
runs with no server (see below).

## Dev

```bash
npm install --legacy-peer-deps
npm run dev            # vite, multi-page: /, /arcade/, /receipts/, /craft/
npm test               # vitest (jsdom)
npm run e2e            # playwright against the production build, desktop + phone
npm run lint           # eslint: the JS arcade, the TS pages, scripts, e2e
npm run typecheck      # tsc --noEmit
npm run build          # sync READMEs, sync the commit data, render the résumé, vite build
npm run sync:receipts  # rebuild the commit data from git (see Commit log below)
npm run audit          # Lighthouse (median of 5), tests, weights on the build → src/data/audit.json
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, the build
and the browser tests on every pull request and on pushes to other branches.
Pushes to `main` deploy to GitHub Pages (`deploy.yml`) after lint, typecheck
and the unit tests pass.

## Structure

```
src/
  main.tsx, App.tsx        the home page, the zoom, the router
  floor/                   the home page ("the floor" the cabinet stands on): header,
                           hero, projects, commit summary, how I work, timeline, footer
  arcade/                  the cabinet, as it always was (JavaScript)
    zoom/                  the URL scheme, history, scroll lock, the zoom itself
  receipts/                the commit log page: pure data model, URL state, charts,
                           the virtualised table, the drawer, the export form
  craft/                   the case study page and its drawn-to-scale diagram
  ui/, lib/, styles/       shared primitives, theme, tokens, number formatting
  data/
    projects.js            every project: identity, copy, links
    profile.js             identity and contact
    site.js                each page's <head>, rendered by vite.config.js
    resume.json            the résumé, rendered to public/resume.html
    receipts.summary.json  commit totals and months, for the home page
    audit.json             what npm run audit measured, quoted by /craft/
scripts/
  sync-readmes.mjs         pulls card copy from each project's README
  sync-receipts.mjs        reads every public repository's git log into the commit data
  build-resume.mjs         resume.json → public/resume.html
  render-og.mjs            the social card, a screenshot of the home page's hero
  axe-report.mjs           prints axe violations for any page of a running build
  audit.mjs                npm run audit: Lighthouse, test counts and weights → src/data/audit.json
  merge-leaderboard.mjs    the TUNNEL_RUN leaderboard (see below)
```

**The zoom.** The cabinet is always laid out at its full-screen size
(`min(900px, 100vw)` × `100dvh`) and scaled into its slot with CSS on the home
page, so the zoom animates a single transform and nothing inside is laid out
again. The URL is the source of truth: `src/arcade/zoom/arcadeRoute.ts`
resolves the route, `useArcadeHistory` owns the History API, and the cabinet
requests navigation instead of calling it directly. `docs/DESIGN-SYSTEM.md`
covers the design.

**Shared code.** Each page is its own HTML file, because GitHub Pages has no
SPA fallback, and all of them load the same `shell` chunk: React, the header
and footer, the theme and the formatters. `vite.config.js` defines it with a
Rolldown `codeSplitting` group. Without it, the automatic splitter gives any
module shared by some pages but not all a chunk of its own; adding `/craft/`
once added a request to the home page and 160 ms to its largest paint on
Lighthouse's simulated phone.

**Measurements.** `npm run audit` serves the build and runs Lighthouse five
times per page, each in a fresh profile, so the home page is measured as a
first visit including its opening animation. It keeps the median run, counts
the unit tests and browser test runs, and measures what each page ships, then
writes `src/data/audit.json`, which `/craft/` displays with the date. Run it
after the tests are final, then rebuild.

## Commit log (`/receipts/`)

`/receipts/` is a small data app over the commit history of my public
repositories. The source is
git, not the GitHub API: `scripts/sync-receipts.mjs` clones every public
repository in `projects.js` (plus this one) bare into `.cache/receipts/` and
reads `git log --shortstat`, which gives exact additions, deletions and file
counts for every commit with no token and no rate limit. It writes
`public/receipts/data.json` (repos and every commit, about 1 MB), 256 small
shards of message bodies under `public/receipts/bodies/` (one is fetched when a
commit is opened), and `src/data/receipts.summary.json` for the home page. It runs
in `npm run build`; when the network is unavailable it keeps the committed
snapshot and the build goes on. `--strict` fails instead, `--report` prints
per-repository counts.

In the browser the page renders its header from the summary, then loads the JSON
once (after the fonts and the next frame, so the download never competes with
the first paint: `src/receipts/useLedger.ts`) and does everything else itself.
`src/receipts/ledger.ts` is the pure model (filter, aggregate, sort, total,
CSV/JSON export), `urlState.ts` is the codec between the view and the query
string (`?from=2026-03&to=2026-06&repo=mentl,sonido&q=bootstrap&merges=0&sort=-additions`),
and the tiles, the three SVG charts, the TanStack table (virtualized with
TanStack Virtual, sorted by the URL) and the export form all read one filtered
list, so they always agree. The export form is a zod schema over the raw
form values with a live preview of the real output.

## Add a project

Add an entry to `PROJECTS` in `src/data/projects.js` (see
`docs/ADDING-A-PROJECT.md`). Presentation fields stay there; content comes
from the project's README at build time, field by field, when that field
passes `docs/README-STANDARD.md`, the one README format every project follows.
`npm run readmes:report` shows how each repository measures up. The home
page's project list, the cabinet's menu, and the no-JavaScript fallback all
render from the same array.

## Résumé

Edit `src/data/resume.json`; `npm run resume:build` renders
`public/resume.html`, and `npm run build` does it for you. The timeline on the
home page is drawn from the same file.

## Global leaderboard, no server

`public/tunnel-leaderboard.json` is the entire database. When a run
qualifies for the global top 10, the game links to a prefilled GitHub issue
titled `[tunnel-run] AAA 12345`. A workflow
(`.github/workflows/leaderboard.yml`) validates the title, merges the score
into the JSON via `scripts/merge-leaderboard.mjs`, commits the file, closes
the issue, and dispatches a Pages deploy. Every high score is a commit, so
the board's history is the git log. Submitting requires a GitHub account;
without one the board is read-only and scores stay in localStorage.

The closed issues double as a visitor log: every submission (accepted or
not) is labeled `leaderboard` and carries the player's GitHub handle.
`gh issue list --label leaderboard --state closed` lists everyone who made
it deep enough into the cabinet to post a score.

At score 1500 the tunnel summons ANOMALY, an inverted A-mark, which
pauses the ambient spawner and fires aimed volleys until its health bar is
emptied. Below 30% health it enrages and fires nearly twice as fast. Each
kill banks a bonus, then escalates the run: the next ANOMALY is bigger,
tougher, and throws denser volleys, and the ambient game gets permanently
faster with a lower spawn floor. Debug: append `?boss=200` to
`/arcade/` to fight it early.
