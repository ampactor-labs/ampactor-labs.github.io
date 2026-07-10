# ampactor.github.io

Arcade cabinet portfolio. CRT scanlines, phosphor glow, game select menu.

Click the coin slot on the cabinet to unlock three hidden programs. One of
them is TUNNEL_RUN, a vector shooter with a global top-10 leaderboard that
runs with no server (see below).

## Dev

```bash
npm install
npm run dev
```

## Deploy

Push to `main`. GitHub Actions builds and publishes to Pages.

## Add a project

Edit the `PROJECTS` array in `src/data/projects.js`:

```js
{
  id: "my-project",
  title: "MY PROJECT",
  subtitle: "WHAT IT IS",
  lang: "Rust",
  color: "#00ffaa",
  icon: "◈",
  github: "https://github.com/ampactor-labs/my-project",
  desc: "Description here.",
  tags: ["tag1", "tag2"],
  category: "systems",
}
```

Identity, contact, and boot copy live in `src/data/profile.js` and
`src/constants.js`. The static `public/resume.html` mirrors that copy by
hand; keep them in sync.

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
emptied. Each kill banks a bonus and schedules a stronger one. Debug:
append `?boss=200` to fight it early.
