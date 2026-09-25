import { useEffect, useId, useMemo, useState } from "react";
import {
  exportFilename,
  exportRows,
  serializeExport,
  type ExportFormat,
  type ExportGroup,
  type ExportOptions,
  type LedgerCommit,
  type LedgerFilter,
} from "./ledger";
import {
  validateExport,
  type ExportRequest,
  type RawExportValues,
} from "./exportSchema";
import { useForm } from "./useForm";
import { bytes, int } from "../lib/format";
import styles from "./Receipts.module.css";

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];

const GROUPS: { value: ExportGroup; label: string }[] = [
  { value: "none", label: "Commit rows" },
  { value: "month", label: "Totals by month" },
  { value: "repo", label: "Totals by repository" },
];

const asFormat = (v: string): ExportFormat => (v === "json" ? "json" : "csv");
const asGroup = (v: string): ExportGroup =>
  v === "month" || v === "repo" ? v : "none";

// Takes the current slice out of the page as a file built in the browser.
// The preview is the real output, so what you read is what you get.
export default function ExportForm({
  commits,
  filter,
}: {
  commits: LedgerCommit[];
  filter: LedgerFilter;
}) {
  const uid = useId();
  const [toast, setToast] = useState<string | null>(null);

  // The file is named after the slice until the visitor names it.
  const autoNameFor = (v: RawExportValues) =>
    exportFilename(
      { format: asFormat(v.format), group: asGroup(v.group), stats: v.stats },
      filter,
    ).replace(/\.\w+$/, "");

  const form = useForm<RawExportValues, ExportRequest>(
    { format: "csv", group: "none", stats: true, filename: "", limit: "" },
    (v) =>
      validateExport(
        { ...v, filename: v.filename.trim() || autoNameFor(v) },
        commits.length,
      ),
  );
  const { values, setValue, touch, errors } = form;
  const format = asFormat(values.format);
  const group = asGroup(values.group);
  const options: ExportOptions = { format, group, stats: values.stats };
  const autoName = autoNameFor(values);
  const effectiveName = values.filename.trim() || autoName;

  const limit = form.result.ok ? form.result.value.limit : undefined;
  const slice = useMemo(
    () => (limit && group === "none" ? commits.slice(0, limit) : commits),
    [commits, limit, group],
  );
  const preview = useMemo(() => {
    const text = serializeExport(slice, options);
    const rows = exportRows(slice, options).rows.length;
    const size = new TextEncoder().encode(text).length;
    const head = text.split(/\r?\n/).filter(Boolean).slice(0, 4).join("\n");
    return { text, rows, size, head };
    // options is rebuilt each render; its three fields are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slice, format, group, values.stats]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const download = (request: ExportRequest) => {
    const blob = new Blob([preview.text], {
      type:
        request.format === "csv"
          ? "text/csv;charset=utf-8"
          : "application/json;charset=utf-8",
    });
    const name = `${request.filename}.${request.format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`Downloaded ${name} · ${bytes(blob.size)}`);
  };

  const errId = (field: string) => `${uid}-${field}-error`;
  const hintId = (field: string) => `${uid}-${field}-hint`;

  return (
    <section className={styles.export} aria-labelledby={`${uid}-heading`}>
      <div className={styles.exportIntro}>
        <p className={styles.eyebrow} aria-hidden="true">
          EXPORT
        </p>
        <h2 id={`${uid}-heading`} className={styles.h2}>
          Export
        </h2>
        <p className={styles.lede}>
          Download the current selection,{" "}
          <strong>{int(commits.length)} commits</strong>, as CSV or JSON. The
          file is built in your browser; nothing is uploaded.
        </p>
      </div>
      <div className={styles.exportGrid}>
        <form
          className={styles.form}
          noValidate
          onSubmit={form.submit(download)}
        >
          <fieldset className={styles.fieldset}>
            <legend>Format</legend>
            <div className={styles.radios}>
              {FORMATS.map((f) => (
                <label key={f.value} className={styles.radio}>
                  <input
                    type="radio"
                    name={`${uid}-format`}
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setValue("format", f.value)}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.fieldset}>
            <legend>Rows</legend>
            <div className={styles.radios}>
              {GROUPS.map((g) => (
                <label key={g.value} className={styles.radio}>
                  <input
                    type="radio"
                    name={`${uid}-group`}
                    value={g.value}
                    checked={group === g.value}
                    onChange={() => setValue("group", g.value)}
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={values.stats}
              onChange={(e) => setValue("stats", e.target.checked)}
            />
            <span>Include line counts</span>
          </label>
          <div className={styles.fieldBlock}>
            <label htmlFor={`${uid}-filename`}>File name</label>
            <div className={styles.inputRow}>
              <input
                id={`${uid}-filename`}
                type="text"
                value={values.filename}
                placeholder={autoName}
                onChange={(e) => setValue("filename", e.target.value)}
                onBlur={() => touch("filename")}
                aria-invalid={errors.filename ? true : undefined}
                aria-describedby={
                  errors.filename ? errId("filename") : hintId("filename")
                }
                autoComplete="off"
                spellCheck={false}
              />
              <span className={styles.ext} aria-hidden="true">
                .{format}
              </span>
            </div>
            {errors.filename ? (
              <p id={errId("filename")} className={styles.error}>
                {errors.filename}
              </p>
            ) : (
              <p id={hintId("filename")} className={styles.hint}>
                Letters, digits, dots, dashes and underscores. Leave it blank to
                name it after the slice.
              </p>
            )}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor={`${uid}-limit`}>
              Row limit <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id={`${uid}-limit`}
              type="text"
              inputMode="numeric"
              value={values.limit}
              placeholder={
                group === "none" ? `up to ${int(commits.length)}` : "—"
              }
              onChange={(e) => setValue("limit", e.target.value)}
              onBlur={() => touch("limit")}
              aria-invalid={errors.limit ? true : undefined}
              aria-describedby={errors.limit ? errId("limit") : hintId("limit")}
              autoComplete="off"
            />
            {errors.limit ? (
              <p id={errId("limit")} className={styles.error}>
                {errors.limit}
              </p>
            ) : (
              <p id={hintId("limit")} className={styles.hint}>
                First N rows in the current sort order. Commit rows only.
              </p>
            )}
          </div>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!form.valid}
          >
            Download {effectiveName}.{format}
          </button>
        </form>
        <aside className={styles.preview} aria-labelledby={`${uid}-preview`}>
          <h3 id={`${uid}-preview`} className={styles.previewTitle}>
            Preview
          </h3>
          <p className={styles.previewMeta}>
            {int(preview.rows)} {preview.rows === 1 ? "row" : "rows"} · ~
            {bytes(preview.size)} · {effectiveName}.{format}
          </p>
          <pre
            className={styles.previewBody}
            tabIndex={0}
            aria-label="First lines of the file"
          >
            {preview.head || "(empty)"}
          </pre>
        </aside>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`${styles.toast} ${toast ? styles.toastOn : ""}`}
      >
        {toast}
      </p>
    </section>
  );
}
