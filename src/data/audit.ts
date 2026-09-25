import data from "./audit.json";

// What `npm run audit` (scripts/audit.mjs) measured on the production build,
// and when. /craft/ quotes these numbers; nothing here is typed by hand.
export interface PageAudit {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcpMs: number;
  lcpMs: number;
  tbtMs: number;
  cls: number;
  speedIndexMs: number;
  htmlGzipKb: number;
  jsGzipKb: number;
}

export interface Audit {
  measuredAt: string;
  tool: string;
  formFactor: string;
  // Lighthouse runs per page; the median run is the one recorded.
  runs?: number;
  pages: Record<string, PageAudit>;
  tests: {
    unit: number;
    browserRuns: number | null;
    browserFiles: number | null;
  };
  // Absent in a file written before the script weighed them.
  assets?: { ledgerGzipKb: number | null; fontsKb: number | null };
}

export const audit = data as Audit;
