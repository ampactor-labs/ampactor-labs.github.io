import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import DetailScreen from "../DetailScreen";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../data/projects";

const fs = (size) => size;
const onBack = vi.fn();

const baseProps = {
  onBack,
  screenWidth: 400,
  screenHeight: 600,
  fs,
};

describe("DetailScreen", () => {
  it("renders a regular project", () => {
    const project = PROJECTS[0];
    const { getByText } = render(
      <DetailScreen {...baseProps} project={project} />,
    );
    expect(getByText(project.title)).toBeTruthy();
    expect(getByText(project.subtitle)).toBeTruthy();
  });

  it("matches snapshot for regular project", () => {
    const project = PROJECTS[0];
    const { container } = render(
      <DetailScreen {...baseProps} project={project} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders back button", () => {
    const project = PROJECTS[0];
    const { getByRole } = render(
      <DetailScreen {...baseProps} project={project} />,
    );
    expect(getByRole("button", { name: /back/i })).toBeTruthy();
  });

  it("renders source link when github present", () => {
    const project = PROJECTS.find((p) => p.github);
    const { getByText } = render(
      <DetailScreen {...baseProps} project={project} />,
    );
    expect(getByText(/source/i)).toBeTruthy();
  });

  it("renders the APK release-page link same-tab", () => {
    // The A button activates a link with a synthetic el.click(); mobile
    // browsers block a programmatic click that spawns a target="_blank"
    // popup, so the releases-page link must navigate same-tab. It is a
    // page now, not a file, so it must NOT carry `download`.
    const apkProject = PROJECTS.find((p) =>
      /github\.com\/[^/]+\/[^/]+\/releases/.test(p.live || ""),
    );
    expect(apkProject, "a project with a releases-page demo link").toBeTruthy();
    const { getByText } = render(
      <DetailScreen {...baseProps} project={apkProject} />,
    );
    const pill = getByText(apkProject.liveLabel).closest("a");
    expect(pill.getAttribute("href")).toBe(apkProject.live);
    expect(pill.getAttribute("target")).toBeNull();
    expect(pill.hasAttribute("download")).toBe(false);
  });

  it("keeps a real web demo opening in a new tab", () => {
    const webDemo = PROJECTS.find(
      (p) => p.live && !/github\.com\/[^/]+\/[^/]+\/releases/.test(p.live),
    );
    if (!webDemo) return; // no non-download demo in the roster; nothing to assert
    const { container } = render(
      <DetailScreen {...baseProps} project={webDemo} />,
    );
    const demoPill = container.querySelector('a[target="_blank"]');
    expect(demoPill).toBeTruthy();
  });

  it("renders synth project with Suspense fallback", () => {
    const synthProject = HIDDEN_PROJECTS.find((p) => p.interactive === "synth");
    const { container } = render(
      <DetailScreen {...baseProps} project={synthProject} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("matches snapshot for synth project", () => {
    const synthProject = HIDDEN_PROJECTS.find((p) => p.interactive === "synth");
    const { container } = render(
      <DetailScreen {...baseProps} project={synthProject} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
