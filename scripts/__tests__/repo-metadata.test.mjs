import { describe, it, expect } from "vitest";
import { CONTACT } from "../../src/data/profile.js";
import { HIDDEN_PROJECTS, PROJECTS } from "../../src/data/projects.js";
import {
  ORG_PROFILE,
  planRepos,
  problemsWith,
  profileReadme,
} from "../repo-metadata.mjs";

describe("the organization page", () => {
  it("gives every public repository one line that passes the writing rules", () => {
    const plan = planRepos();
    expect(problemsWith(plan)).toEqual([]);
    const repos = plan.map((r) => r.repo);
    expect(new Set(repos).size).toBe(repos.length);
    expect(repos).toContain("ampactor-labs.github.io");
  });

  it("catches a line the site would not show", () => {
    const plan = [{ repo: "widget", description: "A seamless tool — for photos." }];
    expect(problemsWith(plan)).toEqual([
      "widget: 1 em dash",
      "widget: filler words: seamless",
    ]);
  });

  it("names whose organization it is, in the site's own line", () => {
    expect(ORG_PROFILE.description).toBe(
      "Morgan Espitia, full-stack software engineer since 2017, building web apps, APIs, compilers, audio software and games.",
    );
    expect(ORG_PROFILE.blog).toBe("https://ampactor.dev");
  });

  it("lists the cartridges the way the select screen does, straight to each one", () => {
    const md = profileReadme();
    const rows = md.split("\n").filter((l) => l.includes("/arcade/#"));
    expect(rows).toEqual(
      PROJECTS.map(
        (p) => `| [${p.title}](https://ampactor.dev/arcade/#${p.id}) | ${p.subtitle} |`,
      ),
    );
  });

  it("never points at the coin's programs or prints the phone", () => {
    const md = profileReadme();
    for (const p of HIDDEN_PROJECTS) expect(md).not.toContain(`#${p.id})`);
    expect(md).not.toContain(CONTACT.phoneTel.slice(2));
    expect(md).not.toContain(CONTACT.phoneDisplay);
  });
});
