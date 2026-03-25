import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import SelectScreen from "../SelectScreen";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../data/projects";

const fs = (size) => size;
const noop = vi.fn();

const baseProps = {
  projects: PROJECTS,
  selectedIdx: 0,
  onSelect: noop,
  onHover: noop,
  onHoverBlip: noop,
  fs,
  gameHighlight: false,
};

describe("SelectScreen", () => {
  it("renders with base projects (no coins)", () => {
    const { getByText } = render(<SelectScreen {...baseProps} />);
    expect(getByText(`${PROJECTS.length} CARTRIDGES LOADED`)).toBeTruthy();
  });

  it("matches snapshot with base projects", () => {
    const { container } = render(<SelectScreen {...baseProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with all projects (coins inserted)", () => {
    const allProjects = [...PROJECTS, ...HIDDEN_PROJECTS];
    const { getByText } = render(
      <SelectScreen {...baseProps} projects={allProjects} />,
    );
    expect(getByText(`${allProjects.length} CARTRIDGES LOADED`)).toBeTruthy();
  });

  it("matches snapshot with all projects", () => {
    const allProjects = [...PROJECTS, ...HIDDEN_PROJECTS];
    const { container } = render(
      <SelectScreen {...baseProps} projects={allProjects} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("highlights selected project", () => {
    const { getAllByRole } = render(<SelectScreen {...baseProps} selectedIdx={1} />);
    const options = getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
  });

  it("renders project list as listbox", () => {
    const { getByRole } = render(<SelectScreen {...baseProps} />);
    expect(getByRole("listbox")).toBeTruthy();
  });

  it("renders contact email", () => {
    const { getByText } = render(<SelectScreen {...baseProps} />);
    expect(getByText("ampactorlabs@gmail.com")).toBeTruthy();
  });
});
