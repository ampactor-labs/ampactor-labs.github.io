import { useRef, useState } from "react";
import ArcadeStage from "./arcade/ArcadeStage";
import {
  initialRouteFromLocation,
  useArcadeHistory,
} from "./arcade/zoom/useArcadeHistory";
import type { TunnelHandle } from "./arcade/tunnelHandle";
import { usePrefersReducedMotion } from "./lib/usePrefersReducedMotion";
import styles from "./arcade/styles/stage.module.css";

// The cabinet is the whole page. The URL decides which screen it shows
// (useArcadeHistory): the title card at "/", the list at "/arcade/", a
// cartridge or an operator program at "/arcade/#<id>". A first visit powers
// the machine on and prints the BIOS; after that it lands where the URL
// points.
export default function App() {
  const [initialRoute] = useState(initialRouteFromLocation);
  const { route, navigate } = useArcadeHistory(initialRoute);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const tunnelRef = useRef<TunnelHandle | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <main id="main" className={styles.main}>
      <ArcadeStage
        route={route}
        onNavigate={navigate}
        reducedMotion={reducedMotion}
        consoleRef={consoleRef}
        tunnelRef={tunnelRef}
      />
    </main>
  );
}
