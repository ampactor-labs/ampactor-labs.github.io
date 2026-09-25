// The arcade's URL scheme, as pure functions. The home page ("the floor" in
// this codebase) is "/", the open cabinet is "/arcade/", and an open project
// is "/arcade/#<project id>". History
// entries carry a small state object so popstate can route without parsing,
// but a null state (a hard load, a hand-edited hash) still resolves from the
// URL alone.

export type ArcadeRoute =
  | { view: "floor" }
  | { view: "arcade"; screen: "select" }
  | { view: "arcade"; screen: "project"; id: string };

export interface ArcadeHistoryState {
  v: 1;
  view: "floor" | "arcade";
  screen?: "select" | "project";
  id?: string;
  // True on the "/arcade/" entry this session pushed from the floor, so
  // leaving the arcade can walk back to the floor entry instead of adding one.
  fromFloor?: boolean;
}

export const FLOOR_ROUTE: ArcadeRoute = { view: "floor" };
export const SELECT_ROUTE: ArcadeRoute = { view: "arcade", screen: "select" };

export const projectRoute = (id: string): ArcadeRoute => ({
  view: "arcade",
  screen: "project",
  id,
});

export function isArcadeHistoryState(
  value: unknown,
): value is ArcadeHistoryState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.v === 1 && (v.view === "floor" || v.view === "arcade");
}

export function isArcadePath(pathname: string): boolean {
  return /^\/arcade\/?$/.test(pathname);
}

// A hash names a cartridge. "#arcade" is the legacy deep link to the cabinet
// itself, not a project.
export function idFromHash(hash: string): string | null {
  const id = decodeURIComponent(hash.replace(/^#/, "")).trim();
  if (!id || id === "arcade") return null;
  return id;
}

export function resolveRoute(
  state: unknown,
  pathname: string,
  hash: string,
): ArcadeRoute {
  if (isArcadeHistoryState(state)) {
    if (state.view === "floor") return FLOOR_ROUTE;
    if (state.screen === "project" && state.id) return projectRoute(state.id);
    return SELECT_ROUTE;
  }
  if (!isArcadePath(pathname)) return FLOOR_ROUTE;
  const id = idFromHash(hash);
  return id ? projectRoute(id) : SELECT_ROUTE;
}

export function stateFor(
  route: ArcadeRoute,
  extra: Pick<ArcadeHistoryState, "fromFloor"> = {},
): ArcadeHistoryState {
  if (route.view === "floor") return { v: 1, view: "floor" };
  if (route.screen === "project") {
    return { v: 1, view: "arcade", screen: "project", id: route.id, ...extra };
  }
  return { v: 1, view: "arcade", screen: "select", ...extra };
}

export function urlFor(route: ArcadeRoute): string {
  if (route.view === "floor") return "/";
  if (route.screen === "project")
    return `/arcade/#${encodeURIComponent(route.id)}`;
  return "/arcade/";
}

export function sameRoute(a: ArcadeRoute, b: ArcadeRoute): boolean {
  if (a.view !== b.view) return false;
  if (a.view === "floor" || b.view === "floor") return true;
  if (a.screen !== b.screen) return false;
  return a.screen === "project" && b.screen === "project"
    ? a.id === b.id
    : true;
}
