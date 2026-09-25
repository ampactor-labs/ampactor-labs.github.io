// Number and date formatting for the data surfaces. One locale, one set of
// rules, so a value reads the same in a tile, a tooltip and a table cell.

const LOCALE = "en-US";

const intFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});

// 1,284 stays exact; from five digits up it compacts: 12.9K, 2.4M.
export function compact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.abs(n) < 10_000 ? intFormat.format(n) : compactFormat.format(n);
}

export function int(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? "—" : intFormat.format(n);
}

export function signed(n: number | null | undefined, sign: "+" | "−"): string {
  return n == null || !Number.isFinite(n)
    ? "—"
    : `${sign}${intFormat.format(n)}`;
}

export function percent(part: number, whole: number): string {
  if (!whole) return "0%";
  const p = (part / whole) * 100;
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}

// "Sep 24, 2026". The commit's own date, not the reader's timezone: the day
// the author committed is the fact, and shifting it can move a commit across
// a month boundary in the charts.
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "Mar 2026" from "2026-03".
export function monthLabel(
  month: string,
  style: "short" | "long" = "short",
): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(LOCALE, {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  });
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
