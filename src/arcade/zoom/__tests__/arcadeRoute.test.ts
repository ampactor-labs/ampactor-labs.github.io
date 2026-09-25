import { describe, it, expect } from "vitest";
import {
  FLOOR_ROUTE,
  SELECT_ROUTE,
  idFromHash,
  isArcadePath,
  projectRoute,
  resolveRoute,
  sameRoute,
  stateFor,
  urlFor,
} from "../arcadeRoute";

describe("arcadeRoute", () => {
  it("routes a hard load from the URL alone", () => {
    expect(resolveRoute(null, "/", "")).toEqual(FLOOR_ROUTE);
    expect(resolveRoute(null, "/arcade/", "")).toEqual(SELECT_ROUTE);
    expect(resolveRoute(null, "/arcade", "")).toEqual(SELECT_ROUTE);
    expect(resolveRoute(null, "/arcade/", "#mentl")).toEqual(
      projectRoute("mentl"),
    );
    expect(resolveRoute(null, "/receipts/", "#mentl")).toEqual(FLOOR_ROUTE);
  });

  it("prefers our history state over the URL", () => {
    expect(
      resolveRoute({ v: 1, view: "floor" }, "/arcade/", "#mentl"),
    ).toEqual(FLOOR_ROUTE);
    expect(
      resolveRoute(
        { v: 1, view: "arcade", screen: "project", id: "sonido" },
        "/",
        "",
      ),
    ).toEqual(projectRoute("sonido"));
    expect(
      resolveRoute({ v: 1, view: "arcade", screen: "select" }, "/", ""),
    ).toEqual(SELECT_ROUTE);
  });

  it("treats foreign state as no state", () => {
    expect(resolveRoute({ screen: "project" }, "/arcade/", "#bits")).toEqual(
      projectRoute("bits"),
    );
    expect(resolveRoute("nonsense", "/", "")).toEqual(FLOOR_ROUTE);
  });

  it("does not read the legacy #arcade hash as a project", () => {
    expect(idFromHash("#arcade")).toBeNull();
    expect(idFromHash("#")).toBeNull();
    expect(idFromHash("")).toBeNull();
    expect(idFromHash("#two-top")).toBe("two-top");
    expect(idFromHash("#celezdial%20selekta")).toBe("celezdial selekta");
  });

  it("recognises the arcade path with or without the slash", () => {
    expect(isArcadePath("/arcade/")).toBe(true);
    expect(isArcadePath("/arcade")).toBe(true);
    expect(isArcadePath("/arcade/x")).toBe(false);
    expect(isArcadePath("/")).toBe(false);
  });

  it("round-trips route → state/url → route", () => {
    for (const route of [FLOOR_ROUTE, SELECT_ROUTE, projectRoute("clob")]) {
      const url = new URL(urlFor(route), "https://ampactor.dev");
      expect(resolveRoute(stateFor(route), url.pathname, url.hash)).toEqual(
        route,
      );
      expect(resolveRoute(null, url.pathname, url.hash)).toEqual(route);
    }
  });

  it("marks the arcade entry pushed from the floor", () => {
    expect(stateFor(SELECT_ROUTE, { fromFloor: true })).toEqual({
      v: 1,
      view: "arcade",
      screen: "select",
      fromFloor: true,
    });
    expect(stateFor(FLOOR_ROUTE, { fromFloor: true })).toEqual({
      v: 1,
      view: "floor",
    });
  });

  it("compares routes structurally", () => {
    expect(sameRoute(FLOOR_ROUTE, { view: "floor" })).toBe(true);
    expect(sameRoute(SELECT_ROUTE, projectRoute("mentl"))).toBe(false);
    expect(sameRoute(projectRoute("mentl"), projectRoute("mentl"))).toBe(true);
    expect(sameRoute(projectRoute("mentl"), projectRoute("bits"))).toBe(false);
  });
});
