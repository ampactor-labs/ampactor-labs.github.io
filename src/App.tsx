import { useCallback, useEffect, useRef, useState } from "react";
import ArcadeStage from "./arcade/ArcadeStage";
import {
  initialRouteFromLocation,
  useArcadeHistory,
} from "./arcade/zoom/useArcadeHistory";
import { useArcadeZoom, type TunnelHandle } from "./arcade/zoom/useArcadeZoom";
import {
  cabinetScale,
  useLayoutWidth,
  useZoomMetrics,
} from "./arcade/zoom/useZoomMetrics";
import { usePrefersReducedMotion } from "./lib/usePrefersReducedMotion";
import Header from "./floor/Header";
import HeroText from "./floor/HeroText";
import Shelf from "./floor/Shelf";
import LedgerTeaser from "./floor/LedgerTeaser";
import HowIWork from "./floor/HowIWork";
import Timeline from "./floor/Timeline";
import Footer from "./floor/Footer";
import styles from "./floor/Floor.module.css";

// The floor, with the cabinet standing in it. The URL decides how deep we are
// (useArcadeHistory), the zoom hook moves the same console between the slot
// and the full viewport, and the stage renders the cabinet in whichever mode
// that leaves it in.
export default function App() {
  const [initialRoute] = useState(initialRouteFromLocation);
  const { route, navigate } = useArcadeHistory(initialRoute);

  const probeRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);
  const tunnelRef = useRef<TunnelHandle | null>(null);

  const metrics = useZoomMetrics(probeRef);
  const slotWidth = useLayoutWidth(slotRef);
  const scale = cabinetScale(slotWidth, metrics);
  const reducedMotion = usePrefersReducedMotion();

  const zoom = useArcadeZoom({
    initialZoomed: initialRoute.view === "arcade",
    scale,
    consoleRef,
    backdropRef,
    slotRef,
    enterButtonRef,
    tunnelRef,
    reducedMotion,
  });

  const { zoomed, animating, mode, zoomIn, zoomOut } = zoom;

  // The route is the truth; the zoom follows it. Re-checked whenever an
  // animation lands, so a Back pressed mid-zoom still ends in the right place.
  useEffect(() => {
    if (animating) return;
    if (route.view === "arcade" && !zoomed) zoomIn();
    if (route.view === "floor" && zoomed) zoomOut();
  }, [route.view, animating, zoomed, zoomIn, zoomOut]);

  const enterArcade = useCallback(
    (id?: string) => navigate({ type: "enter", id }),
    [navigate],
  );

  const inert = zoomed;

  return (
    <>
      <div ref={probeRef} className={styles.probe} aria-hidden="true" />
      <Header inert={inert} onEnterArcade={() => enterArcade()} />
      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-name">
          <HeroText inert={inert} onEnterArcade={() => enterArcade()} />
          <div className={styles.slotWrap}>
            <div
              ref={slotRef}
              className={styles.slot}
              style={{
                width: Math.round(metrics.zoomW * scale),
                height: Math.round(metrics.zoomH * scale),
              }}
            >
              <ArcadeStage
                mode={mode}
                zoomed={zoomed}
                animating={animating}
                scale={scale}
                metrics={metrics}
                route={route}
                onNavigate={navigate}
                onEnter={() => enterArcade()}
                introVariant={initialRoute.view === "arcade" ? "console" : "screen"}
                reducedMotion={reducedMotion}
                consoleRef={consoleRef}
                backdropRef={backdropRef}
                enterButtonRef={enterButtonRef}
                tunnelRef={tunnelRef}
              />
            </div>
            <p className={styles.slotHint} inert={inert || undefined} aria-hidden="true">
              PRESS START TO ENTER
            </p>
          </div>
        </section>
        <Shelf inert={inert} onOpen={(id) => enterArcade(id)} />
        <LedgerTeaser inert={inert} />
        <HowIWork inert={inert} />
        <Timeline inert={inert} />
      </main>
      <Footer inert={inert} />
    </>
  );
}
