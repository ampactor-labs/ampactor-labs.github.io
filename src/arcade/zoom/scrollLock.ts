// Freezes the page while the cabinet is zoomed. `overflow: hidden` alone lets
// iOS Safari rubber-band the document behind a fixed layer, so the body is
// pinned in place instead, offset by the scroll position it had, and put back
// exactly on unlock. `html { scrollbar-gutter: stable }` (global.css) keeps the
// layout from shifting when the scrollbar disappears.

interface Lock {
  scrollY: number;
  restore: () => void;
}

let lock: Lock | null = null;

export function isScrollLocked(): boolean {
  return lock !== null;
}

export function lockScroll(): void {
  if (lock) return;
  const { body } = document;
  const scrollY = window.scrollY;
  const previous = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };
  body.style.position = "fixed";
  body.style.top = `${-scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  lock = {
    scrollY,
    restore: () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
    },
  };
}

// While locked, "scrolling" means moving the pinned body. Used to bring the
// cabinet's slot into view before the cabinet shrinks back into it.
export function setLockedScrollY(scrollY: number): void {
  if (!lock) return;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  lock.scrollY = Math.min(Math.max(0, scrollY), max);
  document.body.style.top = `${-lock.scrollY}px`;
}

export function lockedScrollY(): number | null {
  return lock ? lock.scrollY : null;
}

export function unlockScroll(): void {
  if (!lock) return;
  const { scrollY, restore } = lock;
  lock = null;
  restore();
  window.scrollTo(0, scrollY);
}
