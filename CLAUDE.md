# CLAUDE.md

ampactor.dev is Morgan Espitia's portfolio. Read this before changing anything
a visitor sees.

## The cabinet is the whole page

The site is an arcade cabinet that fills the viewport. Never put a
conventional website in front of it, around it or in place of it: no landing
page, lobby, hero section, scrolling page with the cabinet embedded in it, or
grid of project cards. Both of these were built, shipped and reverted within a
week:

- **The Lobby** (`c3ca809`, June 2026): a "conversion surface" in front of the
  cabinet. Reverted in `d909343` because it "buried the arcade behind a
  click-through."
- **The floor** (`73cf80b`, September 2026): the cabinet shrunk into a widget
  on a scrolling portfolio page. Reverted in `af51b64`, "Make the cabinet the
  whole page."

Both tried to make the site quick for a recruiter to skim. The cabinet already
does that, and anything more for that reader belongs inside it:

- The title card (attract mode, `/`) is the name, the role, two lines of
  Morgan's own and PRESS START.
  A visitor who touches nothing sees the cartridges and the high scores go by.
- The select screen's header, one press away, has the email, the phone,
  RESUME, GITHUB and LINKEDIN.
- The `<noscript>` list (`src/data/site.js`) is the plain version for
  crawlers, applicant-tracking systems and visitors without JavaScript.

New pages and demos go into the cabinet as cartridges (`src/data/projects.js`)
or operator programs (`src/data/programs.js`), the way `/receipts/` and
`/craft/` hang off HIGH SCORES and HOW TO PLAY.

## The flow

A first visit: the tube lights, the BIOS lines burst by (the last one before
`READY.` is Morgan's), the title card drops in, about two and a half seconds
in all, and any key or tap skips ahead. Then
PRESS START → select screen (`/arcade/`) → a cartridge (`/arcade/#<id>`). A
returning visitor, or a link straight to a cartridge, skips the boot. Back walks cartridge → list → title card. The coin slot
unlocks the hidden programs; the site's copy never points at it.

## Copy

Every claim is literally true and checkable against a project's README
(`docs/README-STANDARD.md`), losses included. The cabinet's in-world text
speaks in a game voice; the pages are plain. `docs/DESIGN-SYSTEM.md` has the
rest.

## Before pushing

```bash
npm install --legacy-peer-deps
npm run lint && npm run typecheck && npm test
npm run e2e    # builds, serves on :4173, runs desktop and Pixel 7
```

The title card must fit a short phone (375×548) without spilling onto PRESS
START; `e2e/home.spec.ts` checks it.
