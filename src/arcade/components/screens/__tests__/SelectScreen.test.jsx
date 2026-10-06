import { describe, it, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";
import SelectScreen from "../SelectScreen";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../../data/projects";

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
  // it("renders with base projects (no coins)", () => {
  //   const { getByText } = render(<SelectScreen {...baseProps} />);
  //   expect(getByText(`${PROJECTS.length} CARTRIDGES LOADED`)).toBeTruthy();
  // });

  it("matches snapshot with base projects", () => {
    const { container } = render(<SelectScreen {...baseProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  // it("renders with all projects (coins inserted)", () => {
  //   const allProjects = [...PROJECTS, ...HIDDEN_PROJECTS];
  //   const { getByText } = render(
  //     <SelectScreen {...baseProps} projects={allProjects} />,
  //   );
  //   expect(getByText(`${allProjects.length} CARTRIDGES LOADED`)).toBeTruthy();
  // });

  it("matches snapshot with all projects", () => {
    const allProjects = [...PROJECTS, ...HIDDEN_PROJECTS];
    const { container } = render(
      <SelectScreen {...baseProps} projects={allProjects} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  // The secret programs dash in once, when the coin unlocks them on this
  // screen, and the entrance comes off once they have landed.
  it("dashes the secret programs in once, only when the coin unlocks them", () => {
    vi.useFakeTimers();
    // The coin scrolls the list to the programs; jsdom has no scrollTo.
    const hadScrollTo = "scrollTo" in Element.prototype;
    if (!hadScrollTo) Element.prototype.scrollTo = () => {};
    try {
      const all = [...PROJECTS, ...HIDDEN_PROJECTS];
      const entering = (container) =>
        container.querySelectorAll('[class*="-enter"]').length;
      const { container, rerender } = render(
        <SelectScreen {...baseProps} coinCount={0} />,
      );
      rerender(<SelectScreen {...baseProps} projects={all} coinCount={3} />);
      expect(entering(container)).toBe(HIDDEN_PROJECTS.length);
      act(() => vi.advanceTimersByTime(1000));
      expect(entering(container)).toBe(0);

      // Back on the list later, they are simply there.
      const again = render(
        <SelectScreen {...baseProps} projects={all} coinCount={3} />,
      );
      expect(entering(again.container)).toBe(0);
    } finally {
      vi.useRealTimers();
      if (!hadScrollTo) delete Element.prototype.scrollTo;
    }
  });

  it("highlights selected project", () => {
    const { getAllByRole } = render(
      <SelectScreen {...baseProps} selectedIdx={1} />,
    );
    const options = getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
  });

  it("renders project list as listbox", () => {
    const { getByRole } = render(<SelectScreen {...baseProps} />);
    expect(getByRole("listbox")).toBeTruthy();
  });

  it("renders contact email", () => {
    const { getAllByText } = render(<SelectScreen {...baseProps} />);
    expect(getAllByText("ampactorlabs@gmail.com").length).toBeGreaterThan(0);
  });
});
