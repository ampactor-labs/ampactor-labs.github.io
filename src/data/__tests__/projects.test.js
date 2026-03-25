import { describe, it, expect } from "vitest";
import { PROJECTS, HIDDEN_PROJECTS } from "../projects";

const REQUIRED_FIELDS = ["id", "title", "subtitle", "lang", "desc", "stack", "color", "icon", "tags"];

describe("PROJECTS", () => {
  it("has at least one project", () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it.each(PROJECTS)("$title has all required fields", (project) => {
    for (const field of REQUIRED_FIELDS) {
      expect(project, `${project.id} missing field: ${field}`).toHaveProperty(field);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = PROJECTS.map((p) => p.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it("all github URLs are strings or null", () => {
    for (const p of PROJECTS) {
      expect(typeof p.github === "string" || p.github === null).toBe(true);
    }
  });
});

describe("HIDDEN_PROJECTS", () => {
  it("has exactly 3 hidden projects", () => {
    expect(HIDDEN_PROJECTS.length).toBe(3);
  });

  it.each(HIDDEN_PROJECTS)("$title has tier field", (project) => {
    expect(project).toHaveProperty("tier");
    expect(typeof project.tier).toBe("number");
  });

  it.each(HIDDEN_PROJECTS)("$title has interactive field", (project) => {
    expect(project).toHaveProperty("interactive");
  });

  it.each(HIDDEN_PROJECTS)("$title has hidden: true", (project) => {
    expect(project.hidden).toBe(true);
  });

  it("has no duplicate IDs with main projects", () => {
    const allIds = [...PROJECTS, ...HIDDEN_PROJECTS].map((p) => p.id);
    const unique = new Set(allIds);
    expect(allIds.length).toBe(unique.size);
  });

  it("tiers are 1, 2, 3", () => {
    const tiers = HIDDEN_PROJECTS.map((p) => p.tier).sort();
    expect(tiers).toEqual([1, 2, 3]);
  });
});
