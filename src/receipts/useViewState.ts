import { useCallback, useEffect, useState } from "react";
import type { LedgerFilter, SortSpec } from "./ledger";
import {
  DEFAULT_VIEW,
  parseViewState,
  serializeViewState,
  type LedgerViewState,
} from "./urlState";

// The view lives in the URL. State changes are written with replaceState
// (typing a search must not bury the Back button), and history moving the
// other way (Back into a shared link, say) re-parses the address.
export function useViewState() {
  const [view, setView] = useState<LedgerViewState>(() =>
    typeof window === "undefined"
      ? DEFAULT_VIEW
      : parseViewState(window.location.search),
  );

  useEffect(() => {
    const search = serializeViewState(view);
    if (search === window.location.search) return;
    const { pathname, hash } = window.location;
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}${search}${hash}`,
    );
  }, [view]);

  useEffect(() => {
    const onPop = () => setView(parseViewState(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setFilter = useCallback(
    (
      patch:
        | Partial<LedgerFilter>
        | ((f: LedgerFilter) => Partial<LedgerFilter>),
    ) =>
      setView((v) => ({
        ...v,
        filter: {
          ...v.filter,
          ...(typeof patch === "function" ? patch(v.filter) : patch),
        },
      })),
    [],
  );

  const setSort = useCallback(
    (sort: SortSpec) => setView((v) => ({ ...v, sort })),
    [],
  );

  const reset = useCallback(
    () =>
      setView((v) => ({ ...v, filter: { ...DEFAULT_VIEW.filter, repos: [] } })),
    [],
  );

  return { view, setFilter, setSort, reset };
}
