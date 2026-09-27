import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  HOME_ROUTE,
  SELECT_ROUTE,
  isArcadeHistoryState,
  projectRoute,
  resolveRoute,
  stateFor,
  urlFor,
  type ArcadeRoute,
} from "./arcadeRoute";
import { isKnownProgramId } from "./knownIds";

// The cabinet asks for navigation with these; the router turns each into
// history entries and hands back the route the address bar now wants.
export type NavIntent =
  | { type: "enter"; id?: string }
  | { type: "open"; id: string }
  | { type: "back" }
  | { type: "exit" }
  | { type: "select" };

// The route the page loaded on. A hash naming nothing the machine has is the
// select screen; the mount normalisation below corrects the address too.
export function initialRouteFromLocation(): ArcadeRoute {
  const route = resolveRoute(
    window.history.state,
    window.location.pathname,
    window.location.hash,
  );
  if (
    route.view === "arcade" &&
    route.screen === "project" &&
    !isKnownProgramId(route.id)
  ) {
    return SELECT_ROUTE;
  }
  return route;
}

// The address for a route, keeping whatever query string the page was
// loaded with (a shared link's tracking parameters, say).
function addressFor(route: ArcadeRoute): string {
  const [path, hash] = urlFor(route).split("#");
  return path + window.location.search + (hash ? `#${hash}` : "");
}

// One owner for history. Entries:
//
//   /            the title card (attract mode)
//   /arcade/     the select screen; marked fromHome when this session pushed
//                it from the title card
//   /arcade/#id  an open cartridge or operator program, always pushed over a
//                select entry
//
// so Back always walks cartridge → select → title card, and Forward walks
// back in.
export function useArcadeHistory(initialRoute: ArcadeRoute): {
  route: ArcadeRoute;
  navigate: (intent: NavIntent) => void;
} {
  const [route, setRoute] = useState<ArcadeRoute>(initialRoute);
  const routeRef = useRef(route);
  routeRef.current = route;

  // Normalise the entry we loaded on so every popstate sees our state. A
  // deep-linked cartridge gets a select entry beneath it so Back lands on the
  // list rather than off the site; a corrected deep link loses the hash that
  // named nothing. Any other entry keeps the address it was loaded with.
  // A layout effect, so this has run before any effect of the cabinet's can
  // navigate.
  useLayoutEffect(() => {
    const { history, location } = window;
    if (initialRoute.view === "arcade" && initialRoute.screen === "project") {
      history.replaceState(stateFor(SELECT_ROUTE), "", addressFor(SELECT_ROUTE));
      history.pushState(stateFor(initialRoute), "", addressFor(initialRoute));
    } else if (initialRoute.view === "arcade" && location.hash) {
      history.replaceState(stateFor(initialRoute), "", addressFor(initialRoute));
    } else {
      history.replaceState(stateFor(initialRoute), "");
    }
    // Mount only: the initial route is by definition the one we loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      setRoute(
        resolveRoute(e.state, window.location.pathname, window.location.hash),
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((intent: NavIntent) => {
    const { history } = window;
    const current = routeRef.current;
    const push = (next: ArcadeRoute, fromHome = false) => {
      history.pushState(stateFor(next, { fromHome }), "", addressFor(next));
      routeRef.current = next;
      setRoute(next);
    };
    const replace = (next: ArcadeRoute) => {
      history.replaceState(stateFor(next), "", addressFor(next));
      routeRef.current = next;
      setRoute(next);
    };

    switch (intent.type) {
      case "enter": {
        if (current.view === "home") push(SELECT_ROUTE, true);
        if (intent.id) push(projectRoute(intent.id));
        return;
      }
      case "open": {
        push(projectRoute(intent.id));
        return;
      }
      case "select": {
        // A correction (unknown cartridge), not a navigation: no new entry.
        replace(SELECT_ROUTE);
        return;
      }
      case "back": {
        // Every cartridge entry in this session sits over a select entry we
        // wrote, whether pushed here or laid down under a deep link.
        if (current.view === "arcade" && current.screen === "project") {
          history.back();
        } else if (current.view === "arcade") {
          replace(SELECT_ROUTE);
        }
        return;
      }
      case "exit": {
        if (current.view !== "arcade") return;
        const state: unknown = history.state;
        if (isArcadeHistoryState(state) && state.fromHome) {
          // We came from the title card's entry directly beneath; walk back
          // onto it.
          history.back();
        } else {
          // Hard-loaded at /arcade/ (or leaving from a cartridge): give the
          // title card its own entry so Back returns to the list.
          push(HOME_ROUTE);
        }
        return;
      }
    }
  }, []);

  return { route, navigate };
}
