import type { ReactNode } from "react";
import Header from "../floor/Header";
import Footer from "../floor/Footer";
import MachineDiagram from "./MachineDiagram";
import { audit, type PageAudit } from "../data/audit";
import { summary } from "../data/receiptsSummary";
import { int, shortDate } from "../lib/format";
import styles from "./Craft.module.css";

// The cold open's timings (src/arcade/zoom/coldOpen.ts), copied rather than
// imported: a value this page and the floor share would be split into a
// chunk of its own, one more request before the floor can paint (Lighthouse
// measured +160 ms). The unit test holds these to the real constants.
export const COLD_OPEN_SECONDS = 2.3;
export const PULLBACK_SECONDS = 0.9;

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";
const source = (path: string) => `${REPO}/blob/main/${path}`;
// The change set that took the floor from 88 to 95 and the ledger's layout
// shift to 0; its message carries the before and after.
const SPEED_COMMIT = `${REPO}/commit/b375ca015b214387ca09be1068f782e9c195683a`;

const PAGES: { path: string; name: string }[] = [
  { path: "/", name: "The floor" },
  { path: "/receipts/", name: "Receipts" },
  { path: "/craft/", name: "This page" },
];

const measured = PAGES.flatMap((p) => {
  const a: PageAudit | undefined = audit.pages[p.path];
  return a ? [{ ...p, a }] : [];
});

const CHAPTERS = [
  { id: "machine", title: "One machine, two depths" },
  { id: "ledger", title: "The ledger" },
  { id: "speed", title: "Speed" },
  { id: "proof", title: "Proof" },
  { id: "costs", title: "Costs, and next" },
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

// How this site is made: the first-click answer to what I owned, what was
// hard and why it matters. Every number is read from src/data/audit.json
// (scripts/audit.mjs) or the ledger's summary; none is typed here, except
// the "before" column, which quotes the commit that changed it.
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
            <Machine />
            <Ledger />
            <Speed />
            <Proof />
            <Costs />
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
      { label: "Layout shift", value: cls(shift), sub: "worst page" },
    );
  }
  tiles.push(
    { label: "Unit tests", value: int(audit.tests.unit), sub: "Vitest" },
    {
      label: "Browser runs",
      value: int(audit.tests.browserRuns),
      sub: "Playwright, desktop and phone",
    },
    {
      label: "Third-party requests",
      value: "0",
      sub: "a browser test fails on any",
    },
  );

  return (
    <header className={styles.pageHead}>
      <p className={styles.eyebrow} aria-hidden="true">
        CRAFT
      </p>
      <h1 className={styles.h1}>How this site is made</h1>
      <p className={styles.lede}>
        One person, one repository: the design, the code, the data pipeline, the
        tests and the deploy. Here is <strong>what was hard</strong>,{" "}
        <strong>what I chose</strong>, and <strong>how I know it works</strong>.
        The numbers are measured by a script, and each claim links to where you
        can check it.
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

// The case-study spine, the same three parts in every chapter.
function Facts({
  hard,
  chose,
  know,
}: {
  hard: ReactNode;
  chose: ReactNode;
  know: ReactNode;
}) {
  const rows: [string, string, ReactNode][] = [
    ["▸", "The hard part", hard],
    ["◆", "What I chose", chose],
    ["✓", "How I know", know],
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

function Machine() {
  return (
    <Chapter
      id="machine"
      index={1}
      eyebrow="THE MACHINE"
      title="One machine, two depths"
    >
      <div className={styles.prose}>
        <p>
          The cabinet on the floor and the arcade you walk into are the same
          element. Entering is a camera move, not a page load: the machine grows
          to fill the screen and boots; Escape or Back shrinks it into its slot,
          and the address bar follows along.
        </p>
      </div>
      <Facts
        hard={
          <>
            A console scaled into a slot and the same console at full screen are
            two different layouts. Animating one box into the other either pops
            the content on the first frame or lays it all out again on every
            frame.
          </>
        }
        chose={
          <>
            The console is laid out at its full-screen size all the time, and
            the floor shows it scaled down. Zooming animates one transform, so
            nothing inside reflows and the type is the same at both depths.
          </>
        }
        know={
          <>
            Browser tests check the machine&apos;s layout size on the floor,
            zoom in and out on a desktop and a phone, return focus to the
            machine, and walk Back from a cartridge to the floor.
          </>
        }
      />
      <MachineDiagram />
      <h3 className={styles.h3}>The cold open</h3>
      <div className={styles.prose}>
        <p>
          A first visit starts inside the machine: it powers on in the dark, the
          boot begins, and after {COLD_OPEN_SECONDS} seconds the camera pulls
          back to the room. Any key, tap or scroll ends it at once. It plays
          once, never on a link to a section, never with reduced motion, and it
          writes no history entry. A screen reader reads the floor from the
          start.
        </p>
        <p>
          The first version moved the machine&apos;s box from full screen back
          to its slot on a timer. Chrome counts a move that does not follow
          input as a layout shift: it measured 0.49, and the floor scored 67 for
          performance. Now the stage is pinned over its slot for as long as the
          machine is off the floor, and only the transform moves. A first visit
          measures 0.005. <a href={SPEED_COMMIT}>The commit has the numbers.</a>
        </p>
      </div>
      <h3 className={styles.h3}>Back and Forward</h3>
      <div className={styles.prose}>
        <p>
          One pure function turns a history entry into a place: the floor, the
          cartridge list, or one cartridge. The cabinet asks to move and never
          touches history itself, so Back, Forward, a reload and a shared link
          like <a href="/arcade/#mentl">/arcade/#mentl</a> all land in the same
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

function Ledger() {
  const { totals } = summary;
  const ledgerKb = audit.assets?.ledgerGzipKb;
  return (
    <Chapter
      id="ledger"
      index={2}
      eyebrow="THE LEDGER"
      title="Every commit, as a data product"
    >
      <div className={styles.prose}>
        <p>
          <a href="/receipts/">Receipts</a> is the part of the site shaped like
          a product dashboard: {int(totals.commits)} commits from{" "}
          {int(totals.repos)} repositories to filter, sort, chart and export in
          the browser. It is there so the claims on this site can be checked.
        </p>
      </div>
      <Facts
        hard={
          <>
            The GitHub API gives a commit&apos;s line counts one request at a
            time, behind a rate limit: thousands of calls on every build.
          </>
        }
        chose={
          <>
            Git itself. The build keeps a bare clone of each public repository
            and reads <Code>git log --shortstat</Code>: exact lines and files
            for every commit, no token, no limit. If the network fails, the last
            snapshot ships.
          </>
        }
        know={
          <>
            Unit tests pin the filters, the sort, the monthly and per-repository
            totals and the export schema. A browser test filters, reloads, and
            checks that the address brought the view back.
          </>
        }
      />
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          <strong>One slice.</strong> The tiles, the three charts, the table and
          the export all read the same filtered list, so no two of them can
          disagree.
        </li>
        <li>
          <strong>The address is the state.</strong> Filters and sort live in
          the query string, so every view is a link. TanStack Table supplies the
          column model; the sort is read from the address.
        </li>
        <li>
          <strong>{int(totals.commits)} rows, a screenful in the page.</strong>{" "}
          TanStack Virtual renders the rows in view. Under 640 pixels each row
          becomes a card.
        </li>
        <li>
          <strong>Colour by the numbers.</strong> The chart colours went through
          a palette checker for lightness, colour-blind separation and contrast
          against each theme. The dark theme&apos;s added and removed pair only
          reaches the colour-blind floor, so those charts also show the sign by
          position, with a legend and direct labels.
        </li>
        <li>
          <strong>Weight.</strong> The ledger
          {ledgerKb ? ` is ${kb(ledgerKb)} gzipped and` : ""} loads after the
          first paint. A commit&apos;s full message is fetched when you open it,
          from one of 256 small files.
        </li>
      </ul>
      <Links
        items={[
          ["This site's commits in the ledger", "/receipts/?repo=site"],
          ["scripts/sync-receipts.mjs", source("scripts/sync-receipts.mjs")],
          ["src/receipts/ledger.ts", source("src/receipts/ledger.ts")],
          ["e2e/receipts.spec.ts", source("e2e/receipts.spec.ts")],
        ]}
      />
    </Chapter>
  );
}

function Speed() {
  const floor = audit.pages["/"];
  const ledger = audit.pages["/receipts/"];
  const rows: [string, string, string][] = [
    ["The floor, performance", "88", floor ? String(floor.performance) : "—"],
    ["Receipts, performance", "77", ledger ? String(ledger.performance) : "—"],
    ["Receipts, layout shift", "0.139", ledger ? cls(ledger.cls) : "—"],
    ["Requests to other servers", "Google Fonts", "none"],
  ];
  return (
    <Chapter
      id="speed"
      index={3}
      eyebrow="SPEED"
      title="Fast on a throttled phone"
    >
      <div className={styles.prose}>
        <p>
          Lighthouse slows the page down to a mid-range phone on a slow network.
          One change set moved these:
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
        hard={
          <>
            The slowest request on every page was a stylesheet from Google
            Fonts, and the first paint waited for it. The ledger&apos;s headline
            and footer also moved when its data arrived.
          </>
        }
        chose={
          <>
            The four faces are served from this site, the two that paint first
            are preloaded, and each has a fallback sized from the real
            font&apos;s metrics, so text takes the same room before and after
            the font lands. CSS is inlined into each page, and the ledger&apos;s
            headline reads a summary the build wrote.
          </>
        }
        know={
          <>
            <Code>npm run audit</Code> measures every page of the production
            build, and a browser test fails if any page asks another server for
            anything. <a href={SPEED_COMMIT}>The commit</a> has the before.
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
              <th scope="col">Blocking</th>
              <th scope="col">Layout shift</th>
              <th scope="col">Script, gzipped</th>
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
          <strong>Adding a page is not free.</strong> This page&apos;s first
          build split a small helper out of the code the pages share: one more
          request before the floor could paint, 160 ms on Lighthouse&apos;s
          phone. The shared shell is now one file, pinned in the build config,
          so a new page cannot reshuffle the others.
        </li>
        <li>
          <strong>The data waits its turn.</strong> The ledger&apos;s score used
          to swing by more than ten points from run to run, depending on whether
          its data was requested before the headline painted. The download now
          starts once the headline is on screen, and every page is scored as the
          median of {audit.runs ?? 1} runs.
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

function Proof() {
  const { totals } = summary;
  return (
    <Chapter id="proof" index={4} eyebrow="PROOF" title="How I know it works">
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          <strong>
            {int(audit.tests.unit)} unit tests and{" "}
            {int(audit.tests.browserRuns)} browser runs
          </strong>{" "}
          on a desktop and a Pixel 7: the zoom, the cold open, Back and Forward,
          the ledger&apos;s filters and export, and this page. CI runs all of
          them on every pull request.
        </li>
        <li>
          <strong>Accessibility is a gate.</strong> axe runs inside the browser
          suite on the floor, the ledger and this page, at both sizes, and any
          violation fails it. Everything works from the keyboard; the zoomed
          cabinet is a modal dialog, and focus comes back to the machine.
        </li>
        <li>
          <strong>Nothing from anyone else&apos;s server.</strong> No fonts, no
          analytics, no scripts: a browser test fails if any page asks another
          origin for anything.
        </li>
        <li>
          <strong>The numbers are measured.</strong> <Code>npm run audit</Code>{" "}
          runs Lighthouse on the production build, counts the tests, weighs what
          each page ships, and writes the file this page reads.
        </li>
        <li>
          <strong>Every commit says what was checked.</strong> Each commit in
          this rebuild ends with a <Code>Checked:</Code> line: the suites that
          passed and what I looked at by eye before it was pushed.
        </li>
      </ul>
      <h3 className={styles.h3}>With AI, checked by hand</h3>
      <div className={styles.prose}>
        <p>
          I build with Claude Code as a pair. {int(totals.withClaude)} of the{" "}
          {int(totals.commits)} commits in the ledger name it as author or
          co-author. It writes fast and remembers nothing, so I read every diff,
          and the checks above run on every change, whoever wrote it.
        </p>
      </div>
      <Links
        items={[
          [".github/workflows/ci.yml", source(".github/workflows/ci.yml")],
          ["The browser suite", `${REPO}/tree/main/e2e`],
          ["The commits", `${REPO}/commits/main`],
        ]}
      />
    </Chapter>
  );
}

function Costs() {
  const floor = audit.pages["/"];
  const ledger = audit.pages["/receipts/"];
  const fontsKb = audit.assets?.fontsKb;
  return (
    <Chapter
      id="costs"
      index={5}
      eyebrow="COSTS"
      title="What it costs, and what is next"
    >
      <ul className={`${styles.points} ${styles.prose}`}>
        <li>
          <strong>The pages render in the browser.</strong> Nothing is
          prerendered, so text waits for the script: on a throttled phone the
          ledger&apos;s largest paint lands
          {ledger ? ` at ${seconds(ledger.lcpMs)}` : " late"}. Next: render each
          page&apos;s text at build time.
        </li>
        <li>
          <strong>
            The cold open costs a first visit about{" "}
            {Math.round(COLD_OPEN_SECONDS + PULLBACK_SECONDS)} seconds.
          </strong>{" "}
          It ends on any key, tap or scroll, and never plays twice. Lighthouse
          loads the floor as a first visit, so its largest paint is a line of
          the boot text, printed on the show&apos;s own clock
          {floor ? ` at ${seconds(floor.lcpMs)}` : ""}: the floor&apos;s score
          is partly the show&apos;s timing. I think the first impression is
          worth it.
        </li>
        <li>
          <strong>A full-size machine on the floor.</strong> The miniature is
          laid out at full-screen size, which costs more layout than a picture
          would, in exchange for a zoom that never pops.
        </li>
        <li>
          <strong>A git cache.</strong> Reading history from git means keeping
          the repositories: about 200 MB of bare clones, cached between CI runs.
        </li>
        <li>
          <strong>
            {fontsKb ? `${kb(fontsKb)} of fonts.` : "Four fonts."}
          </strong>{" "}
          Four self-hosted faces, two of them preloaded. A system font would
          cost nothing, and would not look like this.
        </li>
      </ul>
      <div className={styles.prose}>
        <p>
          Also next: time the pull-back on real phones (the automated runs use a
          software renderer), a 404 page in the same room, and a social card for
          the ledger.
        </p>
      </div>
    </Chapter>
  );
}
