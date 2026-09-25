import { z } from "zod";

// The export form's contract. Raw form values in, a typed request out, and
// one message per field when something is off. The schema depends on the
// slice (a row limit cannot exceed the rows there are), so it is built.

export const FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export interface RawExportValues {
  format: string;
  group: string;
  stats: boolean;
  filename: string;
  limit: string;
}

export type ExportField = keyof RawExportValues;

export function buildExportSchema(maxRows: number) {
  return z
    .object({
      format: z.enum(["csv", "json"]),
      group: z.enum(["none", "month", "repo"]),
      stats: z.boolean(),
      filename: z
        .string()
        .trim()
        .min(1, "Give the file a name.")
        .max(64, "Keep the name to 64 characters.")
        .regex(
          FILENAME,
          "Letters, digits, dots, dashes and underscores only, and no extension.",
        ),
      limit: z
        .string()
        .trim()
        .transform((s, ctx) => {
          if (s === "") return undefined;
          if (!/^\d+$/.test(s)) {
            ctx.addIssue({ code: "custom", message: "Whole numbers only." });
            return z.NEVER;
          }
          const n = Number(s);
          if (maxRows === 0) {
            ctx.addIssue({
              code: "custom",
              message: "There are no rows to limit.",
            });
            return z.NEVER;
          }
          if (n < 1 || n > maxRows) {
            ctx.addIssue({
              code: "custom",
              message: `Between 1 and ${maxRows.toLocaleString("en-US")}.`,
            });
            return z.NEVER;
          }
          return n;
        }),
    })
    .superRefine((v, ctx) => {
      if (v.group !== "none" && v.limit !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["limit"],
          message: "A row limit applies to commit rows only.",
        });
      }
    });
}

export type ExportRequest = z.output<ReturnType<typeof buildExportSchema>>;

export type Validation<T, F extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: Partial<Record<F, string>> };

export function validateExport(
  values: RawExportValues,
  maxRows: number,
): Validation<ExportRequest, ExportField> {
  const result = buildExportSchema(maxRows).safeParse(values);
  if (result.success) return { ok: true, value: result.data };
  const errors: Partial<Record<ExportField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as ExportField] = issue.message;
    }
  }
  return { ok: false, errors };
}
