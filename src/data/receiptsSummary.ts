import data from "./receipts.summary.json";

// What scripts/sync-receipts.mjs writes beside the ledger: small enough to
// ship inside the page, so the floor and the ledger's own headline have their
// numbers before any fetch.
export interface ReceiptsSummary {
  generatedAt: string;
  totals: {
    commits: number;
    repos: number;
    additions: number;
    deletions: number;
    first: string | null;
    last: string | null;
    withClaude: number;
    checked: number;
  };
  months: { month: string; commits: number }[];
  byRepo: { repo: string; commits: number }[];
  site: {
    sha: string;
    date: string;
    subject: string;
    checked: string | null;
  }[];
}

export const summary = data as ReceiptsSummary;
