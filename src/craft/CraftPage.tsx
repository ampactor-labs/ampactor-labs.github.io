import type { ReactNode } from "react";
import Header from "../floor/Header";
import Footer from "../floor/Footer";
import MachineDiagram from "./MachineDiagram";
import { audit, type PageAudit } from "../data/audit";
import { summary } from "../data/receiptsSummary";
import { int, shortDate } from "../lib/format";
import styles from "./Craft.module.css";

// The first-visit animation's timings (src/arcade/zoom/coldOpen.ts), copied
// rather than imported: a module this page and the home page both import
// would be split into a chunk of its own, adding a request before the home
// page renders (Lighthouse measured +160 ms). The unit test checks these
// against the real constants.
export const COLD_OPEN_SECONDS = 2.3;
export const PULLBACK_SECONDS = 0.9;

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";
const source = (path: string) => `${REPO}/blob/main/${path}`;
// The commit that took the home page from 88 to 95 and the commits page's
// layout shift to 0. Its message has the before and after numbers.
const SPEED_COMMIT = `${REPO}/commit/b375ca015b214387ca09be1068f782e9c195683a`;

const PAGES: { path: string; name: string }[] = [
  { path: "/", name: "Home" },
  { path: "/receipts/", name: "Commits" },
  { path: "/craft/", name: "This page" },
];

const measured = PAGES.flatMap((p) => {
  const a: PageAudit | undefined = audit.pages[p.path];
  return a ? [{ ...p, a }] : [];
});

const CHAPTERS = [
  { id: "zoom", title: "The cabinet zoom" },
  { id: "commits", title: "The commit log" },
  { id: "performance", title: "Performance" },
  { id: "testing", title: "Testing" },
  { id: "tradeoffs", title: "Tradeoffs" },
] as const;

const STACK = [
  "React 19",
  "TypeScript",
  "Vite 8",
  "CSS Modules",
  "GSAP",
  "TanStack Table + Virtual",
  "zod",
  "Vitest",
  "Playwright + axe",
  "GitHub Actions + Pages",
];

const runsNote =
  audit.runs && audit.runs > 1 ? `median of ${audit.runs} runs, ` : "";
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const cls = (v: number) => (v === 0 ? "0" : v.toFixed(3));
const kb = (v: number) => `${Math.round(v)} KB`;

// A case study of this site. Every number comes from src/data/audit.json
// (written by scripts/audit.mjs) or the commit summary, except the "before"
// column, which quotes the commit that changed those numbers.
export default function CraftPage() {
  return (
    <>
      <Header current="craft" />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Head />
        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="On this page">
            <p className={styles.tocTitle} aria-hidden="true">
              ON THIS PAGE
            </p>
            <ol>
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`}>
                    <span className={styles.tocNum} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.chapters}>
            <Zoom />
            <CommitLog />
            <Performance />
            <Testing />
            <Tradeoffs />
          </div>
        </div>
      </main>
      <Footer inert={false} />
    </>
  );
}

function Head() {
  const n = measured.length;
  const tiles: { label: string; value: string; sub: string }[] = [];
  if (n) {
    const perf = Math.min(...measured.map((m) => m.a.performance));
    const a11y = Math.min(...measured.map((m) => m.a.accessibility));
    const shift = Math.max(...measured.map((m) => m.a.cls));
    tiles.push(
      {
        label: "Performance",
        value: String(perf),
        sub: "Lighthouse on a phone, lowest page",
      },
      {
        label: "Accessibility",
        value: String(a11y),
        sub:
          a11y === 100 ? "Lighthouse, every page" : "Lighthouse, lowest page",
      },
      { label: "Layout shift", value: cls(shift), sub: "highest page" },
    );
  }
  tiles.push(
    { label: "Unit tests", value: int(audit.tests.unit), sub: "Vitest" },
    {
      label: "Browser test runs",
      value: int(audit.tests.browserRuns),
      sub: "Playwright, desktop and phone",
    },
    {
      label: "Third-party requests",
      value: "0",
      sub: "checked by a browser test",
    },
  );

  return (
    <header className={styles.pageHead}>
      <p className={styles.eyebrow} aria-hidden="true">
        CRAFT
      </p>
      <h1 className={styles.h1}>How this site is built</h1>
      <p className={styles.lede}>
        I designed and built this site myself, including the tests, the data
        pipeline and the deployment. Each section covers one part: the problem,
        my approach, and how I verified it. A script measures the numbers on the
        production build, and the links go to the code.
      </p>
      <ul className={styles.stackLine} aria-label="Built with">
        {STACK.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <ul className={styles.tiles} aria-label="Measured">
        {tiles.map((t) => (
          <li key={t.label} className={styles.tile}>
            <span className={styles.tileLabel}>{t.label}</span>
            <span className={styles.tileValue}>{t.value}</span>
            <span className={styles.tileSub}>{t.sub}</span>
          </li>
        ))}
      </ul>
      <p className={styles.measured}>
        Measured {shortDate(audit.measuredAt)} with {audit.tool},{" "}
        {audit.formFactor}, {runsNote}on the production build, by{" "}
        <a href={source("scripts/audit.mjs")}>scripts/audit.mjs</a>.
      </p>
    </header>
  );
}

function Chapter({
  id,
  index,
  eyebrow,
  title,
  children,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.chapter} aria-labelledby={`${id}-h`}>
      <div className={styles.chapterHead}>
        <p className={styles.chapterNum} aria-hidden="true">
          {String(index).padStart(2, "0")} · {eyebrow}
        </p>
        <h2 id={`${id}-h`} className={styles.h2}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// The same three parts in every chapter.
function Facts({
  problem,
  approach,
  verification,
}: {
  problem: ReactNode;
  approach: ReactNode;
  verification: ReactNode;
}) {
  const rows: [string, string, ReactNode][] = [
    ["▸", "Problem", problem],
    ["◆", "Approach", approach],
    ["✓", "Verification", verification],
  ];
  return (
    <dl className={`${styles.facts} reveal`}>
      {rows.map(([glyph, term, body]) => (
        <div key={term} className={styles.fact}>
          <dt>
            <span className={styles.factGlyph} aria-hidden="true">
              {glyph}
            </span>
            {term}
          </dt>
          <dd>{body}</dd>
        </div>
      ))}
    </dl>
  );
}

function Links({ items }: { items: [string, string][] }) {
  return (
    <ul className={styles.links}>
      {items.map(([label, href]) => (
        <li key={href}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className={styles.code}>{children}</code>;
}

function Zoom() {
  return (
    <Chapter id="zoom" index={1} eyebrow="THE ZOOM" title="The cabinet zoom">
      <div className={styles.prose}>
        <p>
          The cabinet on the home page and the full-screen arcade are the same
          DOM element. Clicking the cabinet scales it up to fill the screen, and
          Escape or the browser&apos;s Back button scales it back down. The URL
          updates at each step, so every state can be linked to.
        </p>
      </div>
      <Facts
        problem={
          <>
            The cabinet appears at two sizes: small on the page and full screen
            when open. Animating between two layouts of different sizes either
            makes the content jump on the first frame or forces a new layout on
            every frame.
          </>
        }
        approach={
          <>
            The cabinet is always laid out at its full-screen size, and a CSS
            transform scales it down on the page. Opening it animates only that
            transform, so nothing inside is laid out again and the text renders
            the same at both sizes.
          </>
        }
        verification={
          <>
            Playwright tests check the cabinet&apos;s layout size on the page,
            open and close it on desktop and phone, confirm that focus returns
            to it, and step back through history from a project to the home
            page.
          </>
        }
      />
      <MachineDiagram />
      <h3 className={styles.h3}>First-visit animation</h3>
      <div className={styles.prose}>
        <p>
          On a first visit, the page opens inside the cabinet as it powers on,
          then zooms out to the home page after {COLD_OPEN_SECONDS} seconds. Any
          key, click, tap or scroll skips it. It plays only once, never when a
          link points to a section of the page, and never when the visitor has
          asked for reduced motion. It adds no history entry, and screen readers
          get the page underneath from the start.
        </p>
        <p>
          My first version moved the cabinet&apos;s container back into the page
          on a timer. Chrome counts layout changes that are not caused by user
          input as layout shift, and it scored this one at 0.49, which pulled
          the page&apos;s Lighthouse performance score down to 67. The fix was
          to pin the container in place while the cabinet is open and animate
          only the transform. A first visit now measures 0.005. The numbers are
          in <a href={SPEED_COMMIT}>the commit</a>.
        </p>
      </div>
      <h3 className={styles.h3}>History and deep links</h3>
      <div className={styles.prose}>
        <p>
          A single pure function maps each history entry to a state: the home
          page, the project list, or one project. The cabinet asks for
          navigation instead of calling the History API itself, so Back,
          Forward, a reload and a shared link such as{" "}
          <a href="/arcade/#mentl">/arcade/#mentl</a> all end up in the same
          place.
        </p>
      </div>
      <Links
        items={[
          ["useArcadeZoom.ts", source("src/arcade/zoom/useArcadeZoom.ts")],
          ["arcadeRoute.ts", source("src/arcade/zoom/arcadeRoute.ts")],
          ["coldOpen.ts", source("src/arcade/zoom/coldOpen.ts")],
          ["e2e/floor.spec.ts", source("e2e/floor.spec.ts")],
          ["e2e/arcade.spec.ts", source("e2e/arcade.spec.ts")],
        ]}
      />
    </Chapter>
  );
}

function CommitLog() {
  const { totals } = summary;
  const ledgerKb = audit.assets?.ledgerGzipKb;
  return (
    <Chapter id="commits" index={2} eyebrow="COMMIT LOG" title="The commit log">
      <div className={styles.prose}>
        <p>
          <a href="/receipts/">The commits page</a> is the part of the site
          closest to a product dashboard: {int(totals.commits)} commits from{" "}
          {int(totals.repos)} repositories that you can filter, sort, chart and
          export in the browser.
        </p>
      </div>
      <Facts
        problem={
          <>
            The GitHub API returns line counts one commit at a time and is
            rate-limited, so building the data that way would take thousands of
            requests per build.
          </>
        }
        approach={
          <>
            Read git directly. The build keeps a bare clone of each public
            repository and runs <Code>git log --shortstat</Code>, which gives
            exact line and file counts for every commit with no token and no
            rate limit. If the network is down, the build uses the last
            snapshot.
          </>
        }
        verification={
          <>
            Unit tests cover the filters, sorting, monthly and per-repository
            totals, and the export schema. A Playwright test applies filters,
            reloads the page and checks that the URL restores the same view.
          </>
        }
      />
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          The stat tiles, the three charts, the table and the export all read
          the same filtered array, so they always agree.
        </li>
        <li>
          Filters and sort order are stored in the query string, so any view can
          be shared as a link. TanStack Table provides the column model, and the
          sort is applied from the URL.
        </li>
        <li>
          The table is virtualized with TanStack Virtual, so only the rows on
          screen are rendered. Below 640 px wide, each row becomes a card.
        </li>
        <li>
          I checked the chart colors with a palette validator for lightness,
          color-blind separation and contrast in both themes. In the dark theme
          the pair for lines added and removed only just passes for color
          blindness, so those charts also show direction by position, with a
          legend and direct labels.
        </li>
        <li>
          The data file{ledgerKb ? ` is ${kb(ledgerKb)} gzipped and` : ""} loads
          after the first paint. A commit&apos;s full message is fetched only
          when you open it, from one of 256 small files.
        </li>
      </ul>
      <Links
        items={[
          ["This site's commits", "/receipts/?repo=site"],
          ["scripts/sync-receipts.mjs", source("scripts/sync-receipts.mjs")],
          ["src/receipts/ledger.ts", source("src/receipts/ledger.ts")],
          ["e2e/receipts.spec.ts", source("e2e/receipts.spec.ts")],
        ]}
      />
    </Chapter>
  );
}

function Performance() {
  const home = audit.pages["/"];
  const commits = audit.pages["/receipts/"];
  const rows: [string, string, string][] = [
    ["Home page, performance", "88", home ? String(home.performance) : "—"],
    [
      "Commits page, performance",
      "77",
      commits ? String(commits.performance) : "—",
    ],
    ["Commits page, layout shift", "0.139", commits ? cls(commits.cls) : "—"],
    ["Requests to other servers", "Google Fonts", "none"],
  ];
  return (
    <Chapter
      id="performance"
      index={3}
      eyebrow="PERFORMANCE"
      title="Performance on a slow phone"
    >
      <div className={styles.prose}>
        <p>
          Lighthouse&apos;s mobile test simulates a mid-range phone on a slow
          connection. One set of changes moved these numbers:
        </p>
      </div>
      <div
        className={`${styles.tableWrap} reveal`}
        tabIndex={0}
        role="region"
        aria-labelledby="speed-before-caption"
      >
        <table className={styles.table}>
          <caption id="speed-before-caption">
            Lighthouse, mobile. Before the change, and as measured{" "}
            {shortDate(audit.measuredAt)}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Before</th>
              <th scope="col">Now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, before, now]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className={styles.was}>{before}</td>
                <td className={styles.now}>{now}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Facts
        problem={
          <>
            Every page waited on a stylesheet from Google Fonts before it could
            render anything. The commits page also shifted its layout when the
            data arrived.
          </>
        }
        approach={
          <>
            I serve the four font files from this site and preload the two used
            first. Each font has a fallback sized from its real metrics, so text
            keeps its size when the font loads. Each page&apos;s CSS is inlined
            into its HTML, and the commits page&apos;s header text comes from a
            summary generated at build time, so it does not change when the data
            arrives.
          </>
        }
        verification={
          <>
            <Code>npm run audit</Code> measures every page of the production
            build, and a browser test fails if any page requests something from
            another server. The before numbers are in{" "}
            <a href={SPEED_COMMIT}>the commit</a>.
          </>
        }
      />
      <div
        className={`${styles.tableWrap} reveal`}
        tabIndex={0}
        role="region"
        aria-labelledby="speed-all-caption"
      >
        <table className={styles.table}>
          <caption id="speed-all-caption">
            Every page: {audit.tool}, {audit.formFactor}, {runsNote}
            {shortDate(audit.measuredAt)}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">Performance</th>
              <th scope="col">Accessibility</th>
              <th scope="col">Best practices</th>
              <th scope="col">SEO</th>
              <th scope="col">Largest paint</th>
              <th scope="col">Blocking time</th>
              <th scope="col">Layout shift</th>
              <th scope="col">JavaScript, gzipped</th>
            </tr>
          </thead>
          <tbody>
            {measured.map(({ path, name, a }) => (
              <tr key={path}>
                <th scope="row">{name}</th>
                <td>{a.performance}</td>
                <td>{a.accessibility}</td>
                <td>{a.bestPractices}</td>
                <td>{a.seo}</td>
                <td>{seconds(a.lcpMs)}</td>
                <td>{int(a.tbtMs)} ms</td>
                <td>{cls(a.cls)}</td>
                <td>{kb(a.jsGzipKb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          Adding this page slowed down the home page at first. The bundler moved
          a small helper that two of the three pages share into its own file,
          which added a request before the home page could render: 160 ms on
          Lighthouse&apos;s simulated phone. The shared code is now pinned into
          a single file in the build config, so adding a page cannot change what
          the other pages load.
        </li>
        <li>
          The commits page scored anywhere from 84 to 97 from one run to the
          next. When its data request started before the headline rendered,
          Lighthouse counted the 186 KB download against the headline. The
          request now starts after the headline is on screen, and each
          page&apos;s score is the median of {audit.runs ?? 1} runs.
        </li>
      </ul>
      <Links
        items={[
          ["src/styles/fonts.css", source("src/styles/fonts.css")],
          ["vite.config.js", source("vite.config.js")],
          ["src/receipts/useLedger.ts", source("src/receipts/useLedger.ts")],
          ["scripts/audit.mjs", source("scripts/audit.mjs")],
          ["e2e/network.spec.ts", source("e2e/network.spec.ts")],
        ]}
      />
    </Chapter>
  );
}

function Testing() {
  const { totals } = summary;
  return (
    <Chapter id="testing" index={4} eyebrow="TESTING" title="Testing">
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          {int(audit.tests.unit)} unit tests in Vitest and{" "}
          {int(audit.tests.browserRuns)} browser test runs in Playwright, on a
          desktop viewport and a Pixel 7. They cover the zoom, the first-visit
          animation, history, the commit filters and export, and this page. CI
          runs all of them on every pull request.
        </li>
        <li>
          axe accessibility checks run in the browser tests on the home page,
          the commits page and this page, at both screen sizes, and any
          violation fails the run. Everything is usable from the keyboard; the
          open cabinet is a modal dialog, and focus returns to it when it
          closes.
        </li>
        <li>
          No page loads anything from another server: no fonts, analytics or
          third-party scripts. A browser test enforces this.
        </li>
        <li>
          <Code>npm run audit</Code> runs Lighthouse on the production build,
          counts the tests, measures what each page ships, and writes the file
          this page takes its numbers from.
        </li>
        <li>
          Every commit in this rebuild ends with a <Code>Checked:</Code> line
          listing what I ran and reviewed before pushing.
        </li>
      </ul>
      <h3 className={styles.h3}>Working with AI</h3>
      <div className={styles.prose}>
        <p>
          I use Claude Code as a pair programmer. {int(totals.withClaude)} of
          the {int(totals.commits)} commits in the commit log list it as author
          or co-author. It is fast but keeps no memory between sessions, so I
          review every diff, and the checks above run on every change no matter
          who wrote it.
        </p>
      </div>
      <Links
        items={[
          [".github/workflows/ci.yml", source(".github/workflows/ci.yml")],
          ["Browser tests", `${REPO}/tree/main/e2e`],
          ["Commit history", `${REPO}/commits/main`],
        ]}
      />
    </Chapter>
  );
}

function Tradeoffs() {
  const home = audit.pages["/"];
  const commits = audit.pages["/receipts/"];
  const fontsKb = audit.assets?.fontsKb;
  return (
    <Chapter
      id="tradeoffs"
      index={5}
      eyebrow="TRADEOFFS"
      title="Tradeoffs and next steps"
    >
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          Pages render in the browser. Nothing is prerendered, so text waits for
          JavaScript: on a throttled phone, the commits page&apos;s largest
          paint is at {commits ? seconds(commits.lcpMs) : "over 2 seconds"}.
          Next step: prerender each page&apos;s text at build time.
        </li>
        <li>
          The first-visit animation costs a new visitor about{" "}
          {Math.round(COLD_OPEN_SECONDS + PULLBACK_SECONDS)} seconds. Any input
          skips it, and it never plays twice. Lighthouse loads the home page as
          a first visit, so its largest paint is a line of the animation&apos;s
          boot text
          {home ? `, at ${seconds(home.lcpMs)}` : ""}, and part of the home
          page&apos;s score comes from the animation&apos;s timing. I decided
          the first impression is worth it.
        </li>
        <li>
          The small cabinet on the home page is laid out at full-screen size,
          which costs more layout work than an image would. In exchange, the
          zoom has no visual jump.
        </li>
        <li>
          Reading history from git means keeping a clone of every repository:
          about 200 MB, cached between CI runs.
        </li>
        <li>
          The four self-hosted fonts add{" "}
          {fontsKb ? kb(fontsKb) : "about 110 KB"}, with two of them preloaded.
          System fonts would cost nothing but would not match the design.
        </li>
      </ul>
      <div className={styles.prose}>
        <p>
          Also next: timing the zoom-out on real phones, since the automated
          runs use a software renderer; a 404 page; and a social card for the
          commits page.
        </p>
      </div>
    </Chapter>
  );
}
