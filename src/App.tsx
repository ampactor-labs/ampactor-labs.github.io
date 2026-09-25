import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ArcadeStage from "./arcade/ArcadeStage";
import {
  initialRouteFromLocation,
  useArcadeHistory,
} from "./arcade/zoom/useArcadeHistory";
import { useArcadeZoom, type TunnelHandle } from "./arcade/zoom/useArcadeZoom";
import {
  PULLBACK_SECONDS,
  clearColdOpen,
  isColdOpenPending,
  markVisited,
} from "./arcade/zoom/coldOpen";
import { useColdOpen } from "./arcade/zoom/useColdOpen";
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
// that leaves it in. A first visit opens inside the machine and pulls back to
// the room (coldOpen.ts); the URL never changes for it.
export default function App() {
  const [initialRoute] = useState(initialRouteFromLocation);
  const { route, navigate } = useArcadeHistory(initialRoute);
  const [coldOpen, setColdOpen] = useState(
    () => initialRoute.view === "floor" && isColdOpenPending(),
  );
  const coldOpenRef = useRef(coldOpen);
  coldOpenRef.current = coldOpen;
  const [mountedZoomed] = useState(
    () => initialRoute.view === "arcade" || coldOpen,
  );

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
    initialZoomed: mountedZoomed,
    scale,
    consoleRef,
    backdropRef,
    slotRef,
    enterButtonRef,
    tunnelRef,
    reducedMotion,
  });

  const { zoomed, animating, mode, zoomIn, zoomOut } = zoom;

  // The machine powers on out of the dark only when it was already
  // full-screen at load; every later walk-up from the floor fires just the
  // tube, because the chassis is already standing there.
  const walkedAwayRef = useRef(false);
  if (mode === "attract") walkedAwayRef.current = true;
  const introVariant =
    mountedZoomed && !walkedAwayRef.current ? "console" : "screen";

  // The show is over: the lights come back on (the pre-paint mark held the
  // room dark), the machine remembers it has booted once, and the camera
  // pulls back to the top of the page, where the name is.
  const endColdOpen = useCallback(() => {
    clearColdOpen();
    markVisited();
    setColdOpen(false);
    zoomOut({
      duration: PULLBACK_SECONDS,
      recentre: false,
      restoreFocus: false,
    });
  }, [zoomOut]);
  useColdOpen(coldOpen, endColdOpen);

  // The route is the truth; the zoom follows it. Re-checked whenever an
  // animation lands, so a Back pressed mid-zoom still ends in the right place.
  useEffect(() => {
    if (animating || coldOpen) return;
    if (route.view === "arcade" && !zoomed) zoomIn();
    if (route.view === "floor" && zoomed) zoomOut();
  }, [route.view, animating, coldOpen, zoomed, zoomIn, zoomOut]);

  const enterArcade = useCallback(
    (id?: string) => {
      if (coldOpenRef.current) {
        // Walking in during the show (a screen reader can reach the floor
        // under the machine) takes the visitor straight in: the machine is
        // already up and booting, and it takes the focus.
        coldOpenRef.current = false;
        clearColdOpen();
        setColdOpen(false);
        consoleRef.current?.focus({ preventScroll: true });
      }
      navigate({ type: "enter", id });
    },
    [navigate],
  );

  // A floor anchor loaded from another page (/#work from the ledger's header)
  // names a section that did not exist when the browser looked for it: the
  // floor is rendered here. Go to it once it does.
  useLayoutEffect(() => {
    if (initialRoute.view !== "floor") return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [initialRoute.view]);

  // Behind the zoomed machine the floor is inert. During the show it is not:
  // the machine covers it for the eye, and assistive tech reads the page.
  const inert = zoomed && !coldOpen;

  return (
    <>
      <div ref={probeRef} className={styles.probe} aria-hidden="true" />
      <Header inert={inert} onEnterArcade={() => enterArcade()} />
      <main id="main" className={styles.main} tabIndex={-1}>
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
                introVariant={introVariant}
                coldOpen={coldOpen}
                reducedMotion={reducedMotion}
                consoleRef={consoleRef}
                backdropRef={backdropRef}
                enterButtonRef={enterButtonRef}
                tunnelRef={tunnelRef}
              />
            </div>
            <p
              className={styles.slotHint}
              inert={inert || undefined}
              aria-hidden="true"
            >
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
