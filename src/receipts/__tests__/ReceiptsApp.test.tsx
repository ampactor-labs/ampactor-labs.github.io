import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import ReceiptsApp from "../ReceiptsApp";
import type { Ledger } from "../ledger";

const LEDGER: Ledger = {
  generatedAt: "2026-09-25T00:00:00.000Z",
  repos: [
    {
      id: "mentl",
      repo: "mentl",
      url: "https://github.com/ampactor-labs/mentl",
      defaultBranch: "main",
      languages: {},
      commits: 2,
      firstCommit: "2026-03-01T12:00:00-06:00",
      lastCommit: "2026-03-31T23:59:00-06:00",
    },
    {
      id: "site",
      repo: "ampactor-labs.github.io",
      url: "https://github.com/ampactor-labs/ampactor-labs.github.io",
      defaultBranch: "main",
      languages: {},
      commits: 2,
      firstCommit: "2026-05-02T08:00:00+00:00",
      lastCommit: "2026-05-02T09:00:00+00:00",
    },
  ],
  commits: [
    {
      sha: "a000001",
      repo: "mentl",
      date: "2026-03-01T12:00:00-06:00",
      subject: "bootstrap: bit-identical L1",
      author: "Morgan Espitia",
      coAuthors: [],
      merge: false,
      additions: 10,
      deletions: 2,
      files: 3,
      hasBody: true,
      checked: null,
    },
    {
      sha: "a000002",
      repo: "mentl",
      date: "2026-03-31T23:59:00-06:00",
      subject: "typeck: peel the rec callee",
      author: "Morgan Espitia",
      coAuthors: ["Claude Opus 5"],
      merge: false,
      additions: 40,
      deletions: 4,
      files: 5,
      hasBody: false,
      checked: null,
    },
    {
      sha: "a000003",
      repo: "site",
      date: "2026-05-02T08:00:00+00:00",
      subject: "merge main",
      author: "Claude",
      coAuthors: [],
      merge: true,
      additions: null,
      deletions: null,
      files: null,
      hasBody: false,
      checked: null,
    },
    {
      sha: "a000004",
      repo: "site",
      date: "2026-05-02T09:00:00+00:00",
      subject: "floor: the cabinet stands in its room",
      author: "Morgan Espitia",
      coAuthors: [],
      merge: false,
      additions: 900,
      deletions: 100,
      files: 20,
      hasBody: true,
      checked: "vitest 168 passed.",
    },
  ],
};

function mockFetch(body: unknown, ok = true) {
  return vi.fn(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(body),
    } as Response),
  );
}

describe("ReceiptsApp", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/receipts/");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("paints the page before it asks for the ledger", async () => {
    const fetchLedger = mockFetch(LEDGER);
    vi.stubGlobal("fetch", fetchLedger);
    render(<ReceiptsApp />);
    // The head is on screen from the build's summary; the ledger waits for
    // that frame, so it never competes with the first paint.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(fetchLedger).not.toHaveBeenCalled();
    await waitFor(() => expect(fetchLedger).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
  });

  it("loads the ledger and answers the filter from the URL", async () => {
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    window.history.replaceState(null, "", "/receipts/?repo=site&merges=0");
    render(<ReceiptsApp />);
    expect(screen.getByRole("status")).toHaveTextContent("Reading the ledger");
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Showing/)).toHaveTextContent(
      "Showing 1 of 4 commits",
    );
    expect(
      screen.getByRole("button", { name: "site 1 commit" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("checkbox", { name: "Include merges" }),
    ).not.toBeChecked();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Every public commit",
    );
  });

  it("writes every control back to the URL and resets to a plain one", async () => {
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    render(<ReceiptsApp />);
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 4 of 4"),
    );
    expect(window.location.search).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "mentl 2 commits" }));
    expect(window.location.search).toBe("?repo=mentl");
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 2 of 4");

    fireEvent.click(screen.getByRole("checkbox", { name: "Include merges" }));
    expect(window.location.search).toBe("?repo=mentl&merges=0");

    fireEvent.change(screen.getByRole("combobox", { name: "From" }), {
      target: { value: "2026-03" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "To" }), {
      target: { value: "2026-03" },
    });
    expect(window.location.search).toBe(
      "?from=2026-03&to=2026-03&repo=mentl&merges=0",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(window.location.search).toBe("");
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 4 of 4");
  });

  it("debounces the subject search into the URL", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    render(<ReceiptsApp />);
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search subjects" }),
      {
        target: { value: "cabinet" },
      },
    );
    expect(window.location.search).toBe("");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(window.location.search).toBe("?q=cabinet");
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1 of 4");
    vi.useRealTimers();
  });

  it("sorts from the column headers and exposes the sort to assistive tech", async () => {
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    render(<ReceiptsApp />);
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
    const date = screen.getByRole("columnheader", { name: /Date/ });
    expect(date).toHaveAttribute("aria-sort", "descending");
    fireEvent.click(within(date).getByRole("button"));
    expect(date).toHaveAttribute("aria-sort", "ascending");
    expect(window.location.search).toBe("?sort=date");
    const added = screen.getByRole("columnheader", { name: /Added/ });
    fireEvent.click(within(added).getByRole("button"));
    expect(added).toHaveAttribute("aria-sort", "descending");
    expect(date).not.toHaveAttribute("aria-sort");
    expect(window.location.search).toBe("?sort=-additions");
  });

  it("previews the export, refuses a bad file name, and names the file after the slice", async () => {
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    window.history.replaceState(null, "", "/receipts/?repo=mentl");
    render(<ReceiptsApp />);
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/2 rows/)).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /Download receipts-mentl\.csv/,
    });
    expect(button).toBeEnabled();

    const name = screen.getByLabelText("File name");
    fireEvent.change(name, { target: { value: "../etc/passwd" } });
    fireEvent.blur(name);
    expect(screen.getByText(/Letters, digits, dots/)).toHaveAttribute(
      "id",
      name.getAttribute("aria-describedby"),
    );
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: /Download/ })).toBeDisabled();

    fireEvent.change(name, { target: { value: "mentl-ledger" } });
    expect(name).not.toHaveAttribute("aria-invalid");
    expect(
      screen.getByRole("button", { name: "Download mentl-ledger.csv" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("radio", { name: "Totals by month" }));
    expect(
      screen.getByRole("button", { name: "Download mentl-ledger.csv" }),
    ).toBeEnabled();
    expect(screen.getByLabelText("First lines of the file")).toHaveTextContent(
      '"month","commits","additions","deletions"',
    );
  });

  it("shows the error face with a retry when the ledger fails to load", async () => {
    vi.stubGlobal("fetch", mockFetch({ nope: true }, false));
    render(<ReceiptsApp />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("HTTP 500");
    vi.stubGlobal("fetch", mockFetch(LEDGER));
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 4 of 4"),
    );
  });
});
