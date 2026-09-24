import { useCallback, useEffect, useRef, useState } from "react";
import {
  FLOOR_ROUTE,
  SELECT_ROUTE,
  isArcadeHistoryState,
  projectRoute,
  resolveRoute,
  stateFor,
  urlFor,
  type ArcadeRoute,
} from "./arcadeRoute";

// The cabinet asks for navigation with these; the router turns each into
// history entries and hands back the route the address bar now wants.
export type NavIntent =
  | { type: "enter"; id?: string }
  | { type: "open"; id: string }
  | { type: "back" }
  | { type: "exit" }
  | { type: "select" };

export function initialRouteFromLocation(): ArcadeRoute {
  return resolveRoute(
    window.history.state,
    window.location.pathname,
    window.location.hash,
  );
}

// One owner for history. Entries:
//
//   /            floor
//   /arcade/     the cabinet's select screen; marked fromFloor when this
//                session pushed it from the floor
//   /arcade/#id  an open cartridge, always pushed over a select entry
//
// so Back always walks cartridge → select → floor, and Forward walks back in.
export function useArcadeHistory(initialRoute: ArcadeRoute): {
  route: ArcadeRoute;
  navigate: (intent: NavIntent) => void;
} {
  const [route, setRoute] = useState<ArcadeRoute>(initialRoute);
  const routeRef = useRef(route);
  routeRef.current = route;

  // Normalise the entry we loaded on so every popstate sees our state. A
  // deep-linked cartridge gets a select entry beneath it so Back lands on the
  // list rather than off the site.
  useEffect(() => {
    const { history } = window;
    if (initialRoute.view === "arcade" && initialRoute.screen === "project") {
      history.replaceState(stateFor(SELECT_ROUTE), "", urlFor(SELECT_ROUTE));
      history.pushState(stateFor(initialRoute), "", urlFor(initialRoute));
    } else {
      history.replaceState(stateFor(initialRoute), "", urlFor(initialRoute));
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
    const push = (next: ArcadeRoute, fromFloor = false) => {
      history.pushState(stateFor(next, { fromFloor }), "", urlFor(next));
      routeRef.current = next;
      setRoute(next);
    };
    const replace = (next: ArcadeRoute) => {
      history.replaceState(stateFor(next), "", urlFor(next));
      routeRef.current = next;
      setRoute(next);
    };

    switch (intent.type) {
      case "enter": {
        if (current.view === "floor") push(SELECT_ROUTE, true);
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
        if (isArcadeHistoryState(state) && state.fromFloor) {
          // We came from the floor entry directly beneath; walk back onto it.
          history.back();
        } else {
          // Hard-loaded at /arcade/ (or leaving from a cartridge): give the
          // floor its own entry so Back returns into the arcade.
          push(FLOOR_ROUTE);
        }
        return;
      }
    }
  }, []);

  return { route, navigate };
}
