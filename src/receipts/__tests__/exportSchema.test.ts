import { describe, it, expect } from "vitest";
import { validateExport, type RawExportValues } from "../exportSchema";

const base: RawExportValues = {
  format: "csv",
  group: "none",
  stats: true,
  filename: "receipts",
  limit: "",
};

describe("exportSchema", () => {
  it("accepts a plain request and types it", () => {
    const r = validateExport(base, 100);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ ...base, limit: undefined });
  });

  it("rejects an unsafe or empty file name with one message", () => {
    const bad = validateExport({ ...base, filename: "../etc/passwd" }, 100);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.filename).toMatch(/letters, digits/i);
    const empty = validateExport({ ...base, filename: "   " }, 100);
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.filename).toBe("Give the file a name.");
    const long = validateExport({ ...base, filename: "x".repeat(65) }, 100);
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.filename).toMatch(/64/);
  });

  it("parses the row limit against the slice", () => {
    const ok = validateExport({ ...base, limit: " 25 " }, 100);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.limit).toBe(25);
    const big = validateExport({ ...base, limit: "101" }, 100);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.errors.limit).toBe("Between 1 and 100.");
    const nan = validateExport({ ...base, limit: "ten" }, 100);
    expect(nan.ok).toBe(false);
    if (!nan.ok) expect(nan.errors.limit).toBe("Whole numbers only.");
    const none = validateExport({ ...base, limit: "1" }, 0);
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.errors.limit).toBe("There are no rows to limit.");
  });

  it("only allows a limit on commit rows", () => {
    const r = validateExport({ ...base, group: "month", limit: "5" }, 100);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.limit).toMatch(/commit rows only/);
  });

  it("rejects unknown formats and groupings", () => {
    const r = validateExport({ ...base, format: "xlsx", group: "week" }, 100);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.format).toBeTruthy();
      expect(r.errors.group).toBeTruthy();
    }
  });
});
