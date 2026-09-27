// Whether this browser has seen the machine boot. A first visit gets the
// power-on and the BIOS lines; every visit after that lands on the title
// card at once. Blocked storage means the boot plays again, which is fine.
export const VISITED_KEY = "ampactor_visited";

export function hasVisited(): boolean {
  try {
    return !!localStorage.getItem(VISITED_KEY);
  } catch {
    return false;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(VISITED_KEY, "1");
  } catch {
    // Blocked storage: the boot plays again next time, which is harmless.
  }
}
