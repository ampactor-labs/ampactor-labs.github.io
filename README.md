# ampactor.dev

Morgan Espitia's portfolio. The home page is an arcade floor: the cabinet
stands in its room in attract mode beside the name and one line of range;
click it and it zooms in place to fill the screen, boots, and every project is
a cartridge. Escape or Back shrinks it back to where it stood. Under the
cabinet: the work as cards, how I work, and a timeline since 2017.

- `/` — the floor (React 19 + TypeScript + Vite; light and dark)
- `/arcade/` — the cabinet, full screen; `/arcade/#<project id>` opens a cartridge
- `/resume.html` — the résumé, static and printable, generated from one JSON file

Click the coin slot on the cabinet to unlock three hidden programs. One of
them is TUNNEL_RUN, a vector shooter with a global top-10 leaderboard that
runs with no server (see below).

## Dev

```bash
npm install --legacy-peer-deps
npm run dev            # vite, multi-page: /, /arcade/
npm test               # vitest (jsdom)
npm run e2e            # playwright against the production build, desktop + phone
npm run lint           # eslint: the JS arcade, the TS floor, scripts, e2e
npm run typecheck      # tsc --noEmit
npm run build          # sync READMEs, render the résumé, vite build
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, the build,
and the browser suite on every push and pull request. Pushes to `main` deploy
to GitHub Pages (`deploy.yml`), which runs the same checks first.

## How it is put together

```
src/
  main.tsx, App.tsx        the floor, the zoom, the router
  floor/                   header, hero, shelf, how-I-work, timeline, footer
  arcade/                  the cabinet, as it always was (JavaScript)
    zoom/                  the URL scheme, history, scroll lock, the zoom itself
  ui/, lib/, styles/       shared primitives, theme, tokens
  data/
    projects.js            every project: identity, copy, links
    profile.js             identity and contact
    site.js                each page's <head>, rendered by vite.config.js
    resume.json            the résumé, rendered to public/resume.html
scripts/
  sync-readmes.mjs         pulls card copy from each project's README
  build-resume.mjs         resume.json → public/resume.html
  render-og.mjs            the social card, screenshotted from the live hero
  merge-leaderboard.mjs    the TUNNEL_RUN leaderboard (see below)
```

**One console, two depths.** The cabinet is always laid out at its zoomed size
(`min(900px, 100vw)` × `100dvh`) and CSS-scaled into its slot on the floor, so
the zoom is a single transform and nothing inside ever reflows. The URL is the
source of truth: `src/arcade/zoom/arcadeRoute.ts` resolves the route,
`useArcadeHistory` owns history, and the cabinet asks for navigation with
intents instead of touching it. See `docs/DESIGN-SYSTEM.md` for the design.

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
