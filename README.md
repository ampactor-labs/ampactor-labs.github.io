# ampactor.dev

Morgan Espitia's portfolio. The home page is an arcade floor: the cabinet
stands in its room in attract mode beside the name and one line of range;
click it and it zooms in place to fill the screen, boots, and every project is
a cartridge. Escape or Back shrinks it back to where it stood. A first visit
starts the other way round: the page opens inside the machine as it powers on,
and the camera pulls back to the room. Under the cabinet: the work as cards, a
ledger of every public commit, how I work, and a timeline since 2017.

- `/` — the floor (React 19 + TypeScript + Vite; light and dark)
- `/arcade/` — the cabinet, full screen; `/arcade/#<project id>` opens a cartridge
- `/receipts/` — the ledger: every public commit, filterable, sortable, charted,
  exportable; the whole view lives in the query string, so any view is a link
- `/resume.html` — the résumé, static and printable, generated from one JSON file

Click the coin slot on the cabinet to unlock three hidden programs. One of
them is TUNNEL_RUN, a vector shooter with a global top-10 leaderboard that
runs with no server (see below).

## Dev

```bash
npm install --legacy-peer-deps
npm run dev            # vite, multi-page: /, /arcade/, /receipts/
npm test               # vitest (jsdom)
npm run e2e            # playwright against the production build, desktop + phone
npm run lint           # eslint: the JS arcade, the TS floor, scripts, e2e
npm run typecheck      # tsc --noEmit
npm run build          # sync READMEs, sync the ledger, render the résumé, vite build
npm run sync:receipts  # rebuild the ledger from git (see Receipts below)
npm run audit          # Lighthouse, mobile, on the build; writes src/data/audit.json
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, the build,
and the browser suite on every push and pull request. Pushes to `main` deploy
to GitHub Pages (`deploy.yml`), which runs the same checks first.

## How it is put together

```
src/
  main.tsx, App.tsx        the floor, the zoom, the router
  floor/                   header, hero, shelf, ledger teaser, how-I-work, timeline, footer
  arcade/                  the cabinet, as it always was (JavaScript)
    zoom/                  the URL scheme, history, scroll lock, the zoom itself
  receipts/                the ledger page: pure data model, URL state, charts,
                           the virtualised table, the drawer, the export form
  ui/, lib/, styles/       shared primitives, theme, tokens, number formatting
  data/
    projects.js            every project: identity, copy, links
    profile.js             identity and contact
    site.js                each page's <head>, rendered by vite.config.js
    resume.json            the résumé, rendered to public/resume.html
    receipts.summary.json  the ledger's totals and months, for the floor
scripts/
  sync-readmes.mjs         pulls card copy from each project's README
  sync-receipts.mjs        reads every public repository's git log into the ledger
  build-resume.mjs         resume.json → public/resume.html
  render-og.mjs            the social card, screenshotted from the live hero
  axe-report.mjs           prints axe violations for any page of a running build
  lighthouse.mjs           npm run audit: Lighthouse on each page of the build
  merge-leaderboard.mjs    the TUNNEL_RUN leaderboard (see below)
```

**One console, two depths.** The cabinet is always laid out at its zoomed size
(`min(900px, 100vw)` × `100dvh`) and CSS-scaled into its slot on the floor, so
the zoom is a single transform and nothing inside ever reflows. The URL is the
source of truth: `src/arcade/zoom/arcadeRoute.ts` resolves the route,
`useArcadeHistory` owns history, and the cabinet asks for navigation with
intents instead of touching it. See `docs/DESIGN-SYSTEM.md` for the design.

## Receipts

`/receipts/` is a small data product on the site's own history. The source is
git, not the GitHub API: `scripts/sync-receipts.mjs` clones every public
repository in `projects.js` (plus this one) bare into `.cache/receipts/` and
reads `git log --shortstat`, which gives exact additions, deletions and file
counts for every commit with no token and no rate limit. It writes
`public/receipts/data.json` (repos and every commit, about 1 MB), 256 small
shards of message bodies under `public/receipts/bodies/` (one is fetched when a
commit is opened), and `src/data/receipts.summary.json` for the floor. It runs
in `npm run build`; when the network is unavailable it keeps the committed
snapshot and the build goes on. `--strict` fails instead, `--report` prints
per-repository counts.

In the browser the page loads the JSON once and does everything else itself.
`src/receipts/ledger.ts` is the pure model (filter, aggregate, sort, total,
CSV/JSON export), `urlState.ts` is the codec between the view and the query
string (`?from=2026-03&to=2026-06&repo=mentl,sonido&q=bootstrap&merges=0&sort=-additions`),
and the tiles, the three SVG charts, the TanStack table (virtualised with
TanStack Virtual, sorted by the URL) and the export form all read one filtered
slice, so they cannot disagree. The export form is a zod schema over the raw
form values with a live preview of the real output.

## Add a project

Add an entry to `PROJECTS` in `src/data/projects.js` (see
`docs/ADDING-A-PROJECT.md`). Content fields (`desc`, `operatorNote`, status)
are pulled from the project's README at build time; presentation fields stay
here. The floor's shelf, the cabinet's list, and the no-JavaScript fallback all
render from the same array.

## Résumé

Edit `src/data/resume.json`; `npm run resume:build` renders
`public/resume.html`, and `npm run build` does it for you. The timeline on the
floor is drawn from the same file.

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

At score 1500 the tunnel summons ANOMALY — the A-mark inverted — which
pauses the ambient spawner and fires aimed volleys until its health bar is
emptied. Below 30% health it enrages and fires nearly twice as fast. Each
kill banks a bonus, then escalates the run: the next ANOMALY is bigger,
tougher, and throws denser volleys, and the ambient game gets permanently
faster with a lower spawn floor. Debug: append `?boss=200` to
`/arcade/` to fight it early.
