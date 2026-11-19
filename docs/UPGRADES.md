# Upgrades

The big changes worth building next, each written so it can be picked up and
built: what it is, why, how, what could go wrong, and when it is done. They
come from the November 2026 audit (`docs/AUDIT-2026-11.md`, section 7). The
bugs and small fixes from that audit are already shipped; what was left for
Morgan is listed in that document's status section.

Every upgrade here keeps the rules in `CLAUDE.md`:

- The cabinet is the whole page. Each upgrade is a cartridge, a screen, a
  control or a build step. None is a page in front of the cabinet, around it
  or in place of it, and none brings back the title card or an attract loop
  in front of the list.
- The words are Morgan's. Where an upgrade needs a label or a line, it says
  so and leaves the slot empty.

Effort: **S** under half a day, **M** one to three days, **L** a week or
more.

## The idea behind most of them

The cabinet says who Morgan is and lists the work. It doesn't yet show the
work. Of the 21 cartridges:

- 15 are live web apps that GitHub Pages serves on this host, at
  `ampactor.dev/<repo>/`. All 15 answer 200, and none sends `X-Frame-Options`
  or `frame-ancestors`.
- MENTL is a compiler that is one WebAssembly file.

So most of these move the projects onto the tube.

## Order

1. **First:**
   - Real cartridge pages (1) and pictures of the work (2). They share a
     build step, and they fix search and sharing.
   - Truth on autopilot (10), so the cards stay true without a hand audit.
   - Know who plays (9), so the next bets are measured.
2. **Then:**
   - Insert the cartridge (3).
   - MENTL runs (4).
   - An installable cabinet (7).
3. **When there's time:**
   - Real controllers (6).
   - A GPU tube (5).
   - A leaderboard visitors use (8).
   - The edge (11).

---

## 1. Every cartridge is a real page (L)

**What.**

- `/arcade/wasatch/` instead of `/arcade/#wasatch`, as a real file in
  `dist/`.
- Each page carries its own title, description, canonical URL and social
  card.
- The readout's text is in the HTML before any script runs.
- The cabinet opens and closes cartridges exactly as now. Only the address
  changes.

**Why.**

- Today there is one indexable page of work. The sitemap lists the home
  page, the two paper pages, the résumé and the demos, but no cartridge,
  because a fragment is not a page to a crawler.
- Every shared link to a cartridge previews as the same picture of the list.
- /craft/ already names this as the next step ("prerender each page's text at
  build time").

**How.**

- **Router.**
  - `src/arcade/zoom/arcadeRoute.ts` maps `/arcade/<id>/` to the project
    route and back.
  - `resolveRoute` keeps reading `#<id>`, and the mount normalisation in
    `useArcadeHistory.ts` rewrites a fragment address to the path with
    `replaceState`, so old links keep working.
  - `urlFor` returns the path.
- **Build.**
  - `src/data/site.js` gains one entry per project, derived from `PROJECTS`.
    Its title is the cartridge's title plus the site name; its description is
    the project's outcome, which is already the README's first sentence;
    its image is the cartridge's own card.
  - `vite.config.js` turns `ENTRIES` into inputs today. For these pages,
    render a static `index.html` per project after the client build instead,
    so 21 entries don't each become a chunk.
- **Prerendered text.**
  - A Vite SSR build of a small module renders `DetailScreen` for one
    project, with `react-dom/static` `prerender`.
  - The output goes into the page's `#root`, with the cabinet around it in
    its resting state.
  - On load the client mounts as it does now, with `createRoot` rather than
    hydration, and replaces it. The text was there for crawlers and the first
    paint. Hydration would be cheaper later, but needs the cabinet's state to
    start identical on server and client.
- **Social cards.** `scripts/render-og.mjs` photographs the cabinet with
  Playwright. Give it a path argument and loop over the cartridges, writing
  `public/og/<id>.png` at 1200×630.
- **Structured data.**
  - Wrap the JSON-LD `Person` in a `ProfilePage`.
  - Add an `ItemList` of the projects as `SoftwareSourceCode` (with
    `codeRepository` and `programmingLanguage`) or `WebApplication` (with
    `url`).

**Risks.**

- Breaking Back:
  - `e2e/home.spec.ts` covers deep links and Back.
  - Add path deep links, the old fragment links, and Back from a path deep
    link landing on the list.
- The head of each page:
  - The pre-paint and boot shims must stay identical across pages.
  - `renderHead` already handles that.

**Done when:**

- `curl ampactor.dev/arcade/sonido/` returns Sonido's readout text, its
  title and its own `og:image`.
- The sitemap lists 21 cartridge URLs.
- Every old `#id` link lands on the same cartridge.

## 2. Each readout shows the thing itself (M)

**What.**

- A still of the live project on its readout: on desktop in the empty right
  third (the text column stops at about 520 px), on a phone under the
  header.
- Optionally, a muted loop of a few seconds where motion is the point:
  Wasatch's trains, TUNNEL_RUN, Noodles.

**Why.** A visitor reads about trains and seismometers and sees none of
them. A picture is evidence, not copy, so it adds no words to the screen.

**How.**

- **Capture.** A new script, `scripts/capture-cartridges.mjs`:
  - Visits each project's `live` URL on this host with Playwright, at
    1280×800 and with reduced motion.
  - Waits for a selector or a fixed settle time per project (a small table
    in the script).
  - Writes AVIF stills to `public/cartridges/<id>.avif`, about 40 KB each.
  - A loop is a 4 s AV1 WebM from Playwright's video capture, cut with
    ffmpeg.
- **Projects with no web demo** (turbosort, clob, landed, two-top's APK, the
  Rust crates) get a frame of their own output: a terminal capture rendered
  to an image, or a figure from their README.
- **Show it.**
  - `projects.js` gains `picture: "/cartridges/<id>.avif"`.
  - `DetailScreen` renders it with `loading="lazy"`, explicit dimensions (no
    layout shift) and empty `alt` if it adds nothing the text doesn't. If it
    shows something the text doesn't say, Morgan writes one line of `alt`.
- **Reuse.** The same capture feeds upgrade 1's social cards.
- **Freshness.** Run it by hand when a project changes its look, like
  `render-og`. The images are committed because the deploy has no browser
  to spare.

**Done when:** every cartridge with a demo shows a picture of it, the page
shifts by 0, and the home page ships no more than before (the pictures load
with the readout).

## 3. Insert the cartridge: the demo plays in the tube (M-L)

**What.**

- A on DEMO loads the project's live app inside the CRT, in place of the
  readout.
- The scanlines and the glass stay over it, B ejects it, and the readout
  comes back.
- Opening the demo in a new tab stays available beside it.

**Why.** This is what a cabinet does with a cartridge. The apps already run
on this origin, so nothing has to be rebuilt.

**How.**

- **The screen.**
  - A `PlayScreen` holds a same-origin `<iframe src={p.live}>` sized to the
    tube, with `allow="autoplay; fullscreen"`.
  - It is a new screen state in `useCabinetState` ("play"), with its own
    route `/arcade/<id>/play/` (or `#<id>/play` before upgrade 1), so Back
    ejects.
- **Keys.**
  - The iframe is same-origin, so the cabinet can add a `keydown` listener
    to `iframe.contentWindow`.
  - Escape and the deck's B eject; every other key belongs to the app.
- **Instant start in Chromium.** A `<script type="speculationrules">` with
  `prerender` and `eagerness: "moderate"` for the lit cartridge's demo
  starts loading it on hover. Other browsers ignore it.
- **Phones.**
  - The tube is small there, so the demo takes the whole console.
  - A tap on the deck's B ejects.
- **Audio.**
  - Apps that need a tap to start their audio show their own start, and the
    cabinet doesn't try to unlock it for them.
  - The cabinet's bed goes quiet while a demo plays.

**Risks.**

- **Shared storage and service workers.** The apps share the cabinet's
  localStorage and Cache Storage. apapacho's worker used to delete everyone
  else's caches (fixed in November 2026). Check each app's worker before it
  can play in the tube.
- **Apps that read `window.top`, or assume they own the page.** Keep a
  per-project `playable: true` flag, set only after each has been tried in
  the tube.
- **Focus.**
  - On eject, focus goes back to DEMO.
  - The screen reader hears the app's own title, so name the iframe with the
    cartridge's title.

**Done when:**

- Each playable cartridge runs in the tube on desktop and phone, and B and
  Escape eject from inside it.
- e2e opens one and ejects it, and axe runs on the screen around the frame.

## 4. MENTL runs its own listing (spike S; ship M-L)

**What.**

- A RUN key under the hello listing. It compiles `examples/hello/five.mn`
  with the real compiler and prints the program's output into the tube:
  `hello`, then `2 **`, `6 ******`, `12 ************`.
- Later, an edit mode makes it a small playground.

**Why.** The operators stop being described and can be watched. The listing
also stops drifting from its file: it was out of date for two weeks in
November 2026.

**How.**

- **The listing comes from the repo.**
  - `scripts/sync-readmes.mjs` fetches the file at build time, as it fetches
    READMEs (raw.githubusercontent.com, `HEAD`), into the generated content.
  - A unit test checks that the listing in `projects.js`, kept as the
    offline fallback, equals what was synced.
- **The compiler.**
  - `boot/mentl.wasm` is 4.9 MB, or 1.2 MB with gzip, and imports only WASI
    preview 1.
  - Copy a pinned build into `public/mentl/` at build time (or load it from
    `mentl.ampactor.dev`, which serves it with the right headers), and fetch
    it only on RUN.
- **The host.**
  - Mentl Space already runs this compiler in a worker
    (`ide/wheel-worker.js` in the mentl repo). Start from it.
  - A worker loads the compiler, gives it a WASI preview 1 shim with an
    in-memory file system holding `five.mn`, and runs `mentl run`.
  - Then it runs the module the compiler emits, with stdout collected.
- **Limits.**
  - WebAssembly tail calls are needed: Chrome 112, Firefox 121, Safari 18.2
    and later.
  - Without them, RUN is replaced by the link to Mentl Space.
  - Mentl Space needs cross-origin isolation for shared memory; this program
    starts no thread, so the spike should confirm it runs without isolation.
    GitHub Pages can't send the isolation headers.
- **The cheap first step** (S, in the mentl repo): Mentl Space opens a file
  named in its URL (`?open=examples/hello/five.mn`). MENTL's DEMO then lands
  on the hello program, ready to run.

**Done when:** RUN prints the four lines in Chrome, Firefox and Safari 18.2;
the wasm is fetched only on RUN; and the cartridge says nothing about it
until it works.

## 5. A GPU tube (L)

**What.** One WebGL2 pass draws the tunnel and the CRT together:

- scanlines, bloom and the phosphor's persistence;
- the tube's barrel curvature and vignette.

It runs in a worker through `OffscreenCanvas`.

**Why.**

- The backdrop tunnel now moves behind every screen on desktop.
- It draws with the 2D canvas on the main thread: 30 times a second while
  idle (capped in November 2026), at the display's rate during the boot and
  the game.
- A shader does the same work on the GPU, off the main thread, and draws the
  glow the 2D canvas fakes with wide strokes in `lighter` mode.
- The CRT effects, today CSS layers in `crtStyles.js`, can then curve with
  the glass.

**How.**

- **The shader.**
  - The tunnel is a fragment shader: twelve pentagon rings as a distance
    field, rotated and scaled by `tunnelDepth`.
  - The dust is points, and the reveal circle is a uniform.
- **The worker.**
  - `TunnelCanvas` transfers its canvas with `transferControlToOffscreen()`
    and posts speed, reveal radius and size.
  - The imperative handle (`setSpeed`, `setRevealRadius`) becomes messages.
- **Fallbacks.**
  - No WebGL2, no `OffscreenCanvas` (Safari before 16.4) or a lost context:
    the current 2D canvas.
  - Reduced motion: one still frame, as now.

**Done when:**

- An idle desktop cabinet shows no main-thread drawing at all.
- The boot and the game look the same or better.
- The 2D path still passes e2e with WebGL disabled.

## 6. Real controllers (S-M)

**What.**

- A USB or Bluetooth gamepad drives the cabinet:
  - the d-pad walks the list;
  - A opens, B goes back, Start drops the coin.
- TUNNEL_RUN plays with a stick.
- The deck's keys light as the real ones are pressed.
- On Android, a short vibration on A and B.

**Why.** It is an arcade cabinet. There is no gamepad or haptics code yet.

**How.**

- **Polling.** `src/arcade/useGamepad.js` polls `navigator.getGamepads()` in a
  rAF loop, only while a pad is connected (`gamepadconnected`).
- **Mapping.**
  - Edges, not levels, are mapped to the same intents the keyboard sends
    (`navUp`, `pressA`, `goBack`, `insertCoin`).
  - Map by the standard layout: buttons 0 and 1, d-pad 12 to 15, Start 9.
- **The game.**
  - TUNNEL_RUN reads the left stick's x axis, with a dead zone, alongside
    its keys.
  - That's easier once the game step is a pure function (section 6 of the
    audit).
- **Haptics.**
  - `navigator.vibrate(12)` on A and B where it exists. Never on iOS, which
    lacks it.
  - Skip it under reduced motion.

**Done when:** an Xbox and a PlayStation pad drive the list, a cartridge,
Back, the coin and the game in Chrome and Firefox, and a unit test drives the
mapping with a fake `getGamepads`.

## 7. An installable cabinet (M)

**What.**

- A web app manifest and a service worker.
- On a phone the cabinet installs to the home screen and opens without
  browser chrome, so the tube gets the whole screen.
- Repeat visits load from cache, and it works offline.

**Why.**

- GitHub Pages sends `max-age=600` for every file, hashed ones included.
- A worker keeps the old chunks an open tab still needs. The November 2026
  fix reloads the tab instead; this keeps it running.

**How.**

- **Manifest.**
  - `public/manifest.webmanifest`: `display: "fullscreen"` (with
    `"standalone"` as the fallback), `orientation: "portrait"` and the dark
    `background_color`.
  - The icons exist (`logo-192.png`, `logo-512.png`); add a maskable one.
- **Caching.**
  - `public/sw.js`, registered from `src/main.tsx`.
  - Precache the cabinet's HTML and the hashed assets of the current build:
    write the list into the worker at build time from Vite's manifest.
  - Cache-first for `/assets/` and `/fonts/`; network-first for HTML, with
    the cache as the offline fallback.
- **The hard rule: 15 other apps live on this origin.**
  - The worker's `fetch` handler must return without responding for any path
    outside the portfolio's own: `/`, `/arcade/`, `/receipts/`, `/craft/`,
    `/assets/`, `/fonts/`, `/resume.*`, `/og*`, `/favicon*`.
  - It must never touch other caches. Name its caches `cabinet-` and delete
    only those.
  - apapacho's worker is scoped to `/apapacho/` and stays separate.
- **Updates.** A new worker waits; the next visit takes it. Words for an "a
  new version is ready" sign would be Morgan's; without them, update
  silently on the next load.

**Done when:**

- A second visit makes no network request for hashed files.
- The cabinet boots offline.
- The hosted apps at `/<repo>/` behave exactly as before, checked by e2e on
  one of them with the worker installed.

## 8. A leaderboard visitors use (M)

**What.**

- Submitting a TUNNEL_RUN score without a GitHub account.
- Later, a score that has to be replayed to count.

**Why.** The global board holds two scores in four months, both Morgan's.
Filing a GitHub issue is too much to ask of a visitor, and anyone with an
account can file a made-up score: ten maximums would lock the board for good.

**How.**

- **Interim, in the current design (S).** In `.github/workflows/leaderboard.yml`:
  - Accept automatically only issues whose `author_association` is OWNER,
    MEMBER or COLLABORATOR. Others wait for a maintainer's `accept` label.
  - Keep one row per GitHub user.
  - Give the reply step `if: always()`.
  - Publish with the nightly deploy instead of one deploy per score.
- **The upgrade.**
  - The `ampactor.dev` zone is on Cloudflare (the `mentl` and `space`
    subdomains answer from it).
  - A Worker with D1 takes `POST /api/scores` with initials and score,
    rate-limited by IP, and serves the top ten as JSON.
  - The game reads that instead of `public/tunnel-leaderboard.json`, with
    the file as the fallback.
  - Words on the submit panel stay Morgan's.
- **Replay.**
  - Once the game's step is a pure function of state, input and time (the
    audit's section 6 split of `TunnelGame.jsx`), a submission carries its
    seed and its input log.
  - The Worker re-runs them and records the score it computes.

**Done when:** a visitor without an account can post a score, a forged score
is rejected, and the board survives a burst of submissions.

## 9. Know who plays (S)

**What.**

- Cookieless analytics, either GoatCounter or Cloudflare Web Analytics, with
  a handful of events:
  - a cartridge opened;
  - DEMO, SOURCE and RESUME pressed;
  - the coin inserted.
- Real-user Web Vitals (LCP, INP, CLS).
- A beacon when a chunk fails to load, which the November 2026 fix now
  survives but nobody sees.

**Why.**

- Today there is no way to know whether anyone opens a cartridge, or which
  ones, or where visitors stop.
- Without cookies there is no consent banner, so nothing goes in front of
  the cabinet.

**How.**

- **Script and test.**
  - One script tag in `renderHead`, loaded async.
  - The e2e test that forbids third-party requests gets one allowed origin.
- **Events.** One `track(name, detail)` in `src/lib/track.ts`, called from
  the cabinet's intents in `useCabinetState`, so every input path (keys,
  deck, taps, gamepad) is counted once.
- **Vitals.** The `web-vitals` package (2 KB), reporting through the same
  `track`.

**Done when:** a week of data says how many visitors open a cartridge and
which ones, with no request before the page has painted.

## 10. Truth on autopilot (M)

**What.** A nightly job that fails loudly when the site stops being true.
It checks that:

1. every link on the site and in the noscript list answers;
2. every number in a cartridge's highlights appears in its README;
3. MENTL's listing equals its file;
4. `sync:readmes:check` and `resume:check` pass;
5. Lighthouse runs, and its result is written to `src/data/audit.json`
   with the date.

**Why.**

- `CLAUDE.md` says every claim is literally true and checkable, and today
  that's checked by hand.
- In five weeks a dead DEMO link, an out-of-date listing, a branch mix-up
  and a dozen numbers drifted.
- /craft/ shows Lighthouse numbers measured on 2026-09-25.

**How.**

- **Links.** `scripts/check-links.mjs` collects every URL from
  `projects.js`, `site.js`, `resume.json` and `public/404.html`, and fetches
  each with a HEAD (GET on 405). It fails on 4xx and 5xx; LinkedIn's 999
  counts as a pass.
- **Numbers.** In `scripts/sync-readmes.mjs`, for each highlight, every run
  of digits must occur in that project's README. List the misses and fail
  in `--check` mode. Some highlights are true without their number in the
  README; those get an explicit, reviewed `// verified:` note in
  `projects.js`.
- **Schedule.** A `truth.yml` workflow on the nightly cron and on pull
  requests that touch `src/data/`. It opens an issue when it fails, instead
  of blocking the deploy.
- **Lighthouse.**
  - `scripts/audit.mjs` already does the measuring. Run it in that workflow
    on `ubuntu-24.04` with `--no-write`, and commit `audit.json` only from a
    manual dispatch, so CI's slower machine never publishes worse numbers by
    accident.
  - Better still, publish CI's numbers with CI's benchmark index next to
    them.

**Done when:** a dead link or a highlight number missing from its README
turns the job red the night it happens.

## 11. An edge in front of Pages (S, settings only)

**What.** Turn on Cloudflare's proxy for the apex `ampactor.dev`, which
points straight at GitHub Pages while the subdomains already go through
Cloudflare. That allows:

- real response headers: a Content-Security-Policy, HSTS, and `immutable`
  caching for `/assets/` and `/fonts/`;
- Early Hints;
- analytics with no script.

**Why.** GitHub Pages can't set headers. Every file is cached for ten
minutes, and there is no CSP.

**How.**

1. SSL mode "Full".
2. A Cache Rule for `/assets/*` and `/fonts/*` with a long edge and browser
   TTL.
3. A Transform Rule for the headers. Start the CSP in report-only mode:
   `default-src 'self'` plus the inline styles and scripts the pages use,
   which need hashes or `'unsafe-inline'`.
4. Keep HTML at a short TTL so deploys show at once.

**Risks.**

- GitHub's own certificate renewal on a proxied apex: verify the custom
  domain stays green in the repository's Pages settings after the switch.
- The 15 hosted apps get the same headers. Scope the CSP to the portfolio's
  paths, or test the apps under report-only first.

**Done when:** `curl -I ampactor.dev/assets/<file>.js` shows
`cache-control: public, max-age=31536000, immutable`, and the CSP reports no
violations for a week.

---

## Foundations that make the upgrades cheaper

These were in the audit's section 6 and are worth doing on the way:

- **Gate the deploy on the browser tests.**
  - One workflow where `deploy` needs `check` and `e2e`, and is the only job
    holding `pages: write` and `id-token: write`.
  - Today `deploy.yml` re-runs the unit tests but never the browser tests,
    and one job holds the Pages token through `npm ci` and the build.
- **Split `TunnelGame.jsx`.**
  - Pull out a pure `step(state, input, dt) → events` and a drawing module.
    Upgrades 6 and 8 need it.
  - It also takes the game from 0% covered to testable.
- **One canvas loop.** A `useCanvasLoop` hook for pixel density, the frame
  cap, reduced motion and pausing when hidden, used by all four canvases.
  Upgrade 5 replaces one of them.
- **One sound system.**
  - Rebuild `useTunnelGameAudio.js` on `audio/bus.js` (`voice`, `noise`,
    `withClock`).
  - Route `SynthEngine` through `bus.master`, so SOUND OFF silences the synth
    too.
- **Types where they pay.** `// @ts-check` with JSDoc on `projects.js`,
  `programs.js` and `profile.js`, then type `useCabinetState` and its
  intents.
- **Playwright 1.65 or later.** CI runs on `ubuntu-24.04` because 1.56
  can't install Chromium on 26.04. Upgrading lets the pin go, and adds a
  WebKit project for Safari.
