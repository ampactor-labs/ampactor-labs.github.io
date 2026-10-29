import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import SelectScreen from "../SelectScreen";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../../data/projects";

const fs = (size) => size;
const noop = vi.fn();

const baseProps = {
  projects: PROJECTS,
  selectedIdx: 0,
  onSelect: noop,
  onHover: noop,
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

  // A row lights under a mouse that moves, not under one that holds still
  // while the list scrolls beneath it, and a finger lights it as it lands.
  it("lights a row for a moving mouse or a landing finger, not a still pointer", () => {
    const onHoverSelect = vi.fn();
    const onHover = vi.fn();
    const { getAllByRole } = render(
      <SelectScreen {...baseProps} onHover={onHover} onHoverSelect={onHoverSelect} />,
    );
    const row = getAllByRole("option")[2];
    fireEvent.pointerMove(row, { pointerType: "mouse", movementX: 0, movementY: 0 });
    expect(onHoverSelect).not.toHaveBeenCalled();
    fireEvent.pointerMove(row, { pointerType: "touch", movementX: 3, movementY: 0 });
    expect(onHoverSelect).not.toHaveBeenCalled();
    fireEvent.pointerMove(row, { pointerType: "mouse", movementX: 2, movementY: 1 });
    expect(onHoverSelect).toHaveBeenLastCalledWith(2);
    expect(onHover).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(getAllByRole("option")[4], { pointerType: "touch" });
    expect(onHoverSelect).toHaveBeenLastCalledWith(4);
  });

  // The list comes back where the reader left it, kept as they scroll rather
  // than read at unmount.
  it("comes back where it was scrolled", () => {
    const scrollTops = new WeakMap();
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
    Object.defineProperty(Element.prototype, "scrollTop", {
      configurable: true,
      get() {
        return scrollTops.get(this) ?? 0;
      },
      set(v) {
        scrollTops.set(this, v);
      },
    });
    const hadScrollIntoView = "scrollIntoView" in Element.prototype;
    if (!hadScrollIntoView) Element.prototype.scrollIntoView = () => {};
    try {
      const first = render(<SelectScreen {...baseProps} />);
      const list = first.getByRole("listbox");
      list.scrollTop = 240;
      fireEvent.scroll(list);
      first.unmount();
      const again = render(<SelectScreen {...baseProps} />);
      expect(again.getByRole("listbox").scrollTop).toBe(240);
      again.unmount();
    } finally {
      if (desc) Object.defineProperty(Element.prototype, "scrollTop", desc);
      else delete Element.prototype.scrollTop;
      if (!hadScrollIntoView) delete Element.prototype.scrollIntoView;
    }
  });
});
