# ampactor.github.io

Arcade cabinet portfolio. CRT scanlines, phosphor glow, game select menu.

↑↑↓↓←→←→ for the easter egg.

## Dev

```bash
npm install
npm run dev
```

## Deploy

Push to `main`. GitHub Actions handles the rest.

## Add a project

Edit the `PROJECTS` array in `src/ArcadePortfolio.jsx`:

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
}
```
