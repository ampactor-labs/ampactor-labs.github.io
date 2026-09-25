import { useCallback, useState, type FormEvent } from "react";
import type { Validation } from "./exportSchema";

// A small controlled form over a validator: values, per-field touched
// state, and errors that only show once a field has been visited (or a
// submit was attempted). No library; the schema does the thinking.
export function useForm<TValues extends object, TOut>(
  initial: TValues,
  validate: (values: TValues) => Validation<TOut, keyof TValues & string>,
) {
  const [values, setValues] = useState<TValues>(initial);
  const [touched, setTouched] = useState<
    Partial<Record<keyof TValues, boolean>>
  >({});
  const [attempted, setAttempted] = useState(false);

  const result = validate(values);
  const allErrors: Partial<Record<keyof TValues & string, string>> = result.ok
    ? {}
    : result.errors;
  const errors: Partial<Record<keyof TValues & string, string>> = {};
  for (const key of Object.keys(allErrors) as (keyof TValues & string)[]) {
    if (attempted || touched[key]) errors[key] = allErrors[key];
  }

  const setValue = useCallback(
    <K extends keyof TValues>(key: K, value: TValues[K]) =>
      setValues((v) => ({ ...v, [key]: value })),
    [],
  );

  const touch = useCallback(
    (key: keyof TValues) => setTouched((t) => ({ ...t, [key]: true })),
    [],
  );

  const submit = (handler: (value: TOut) => void) => (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    const r = validate(values);
    if (r.ok) handler(r.value);
  };

  return { values, setValue, touch, errors, valid: result.ok, result, submit };
}
