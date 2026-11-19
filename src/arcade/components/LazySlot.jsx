import { Component, Suspense } from "react";
import { isChunkLoadError, reloadOnce } from "../../lib/staleChunks";

// Suspense for a lazy screen, plus what Suspense alone can't do: when the
// screen's chunk fails to load (a tab left open across a deploy), reload once
// for the new page instead of letting the error take the whole cabinet down.
// Any other error, or a second failure, leaves a RELOAD key in its place.
class ChunkBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) reloadOnce();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          margin: "24px auto",
          display: "block",
          minHeight: 44,
          padding: "0 18px",
          font: "inherit",
          color: "inherit",
          background: "transparent",
          border: "1px solid currentColor",
          cursor: "pointer",
        }}
      >
        RELOAD
      </button>
    );
  }
}

export default function LazySlot({ children }) {
  return (
    <ChunkBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </ChunkBoundary>
  );
}
