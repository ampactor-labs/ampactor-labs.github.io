import styles from "./Craft.module.css";

// The zoom in both states, drawn to scale for a 1280 × 800 screen. The
// cabinet is laid out at min(900px, 100vw) × 100dvh = 900 × 800 in both. On
// the page it is scale(k) in a 640 px wide slot; open, it is translated to
// cover the viewport while its container stays fixed at the slot. Every
// length below is a real pixel value times S.
const S = 260 / 1280;
const VIEW = { w: 1280 * S, h: 800 * S };
const LAYOUT = { w: 900, h: 800 };
const SLOT = { x: 550, y: 135, w: 640 };
const K = SLOT.w / LAYOUT.w;
const slot = {
  x: SLOT.x * S,
  y: SLOT.y * S,
  w: LAYOUT.w * K * S,
  h: LAYOUT.h * K * S,
};
const zoomed = {
  x: ((1280 - LAYOUT.w) / 2) * S,
  y: 0,
  w: LAYOUT.w * S,
  h: LAYOUT.h * S,
};

type Box = { x: number; y: number; w: number; h: number };

// The cabinet in outline: the tube, a d-pad, two buttons. `screen` draws
// what the tube shows at that depth: the attract card, or the list.
function Console({ box, screen }: { box: Box; screen: "attract" | "list" }) {
  const { x, y, w, h } = box;
  const tube = { x: x + w * 0.05, y: y + h * 0.05, w: w * 0.9, h: h * 0.68 };
  const panelY = y + h * 0.86;
  const u = w * 0.03;
  return (
    <g className="cabinet-scope">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={w * 0.035}
        className={styles.dBody}
      />
      <rect
        x={tube.x}
        y={tube.y}
        width={tube.w}
        height={tube.h}
        rx={w * 0.02}
        className={styles.dTube}
      />
      {screen === "attract" ? (
        <rect
          x={tube.x + tube.w * 0.3}
          y={tube.y + tube.h * 0.46}
          width={tube.w * 0.4}
          height={u * 1.1}
          className={styles.dAmber}
        />
      ) : (
        [0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={tube.x + tube.w * 0.1}
            y={tube.y + tube.h * (0.18 + i * 0.17)}
            width={tube.w * (i === 0 ? 0.55 : 0.45 - i * 0.05)}
            height={u * 1.1}
            className={i === 0 ? styles.dCyan : styles.dRow}
          />
        ))
      )}
      <rect
        x={x + w * 0.12 - u * 1.5}
        y={panelY - u * 0.5}
        width={u * 3}
        height={u}
        className={styles.dKnob}
      />
      <rect
        x={x + w * 0.12 - u * 0.5}
        y={panelY - u * 1.5}
        width={u}
        height={u * 3}
        className={styles.dKnob}
      />
      <circle
        cx={x + w * 0.8}
        cy={panelY}
        r={u * 1.1}
        className={styles.dKnob}
      />
      <circle
        cx={x + w * 0.89}
        cy={panelY}
        r={u * 1.1}
        className={styles.dKnob}
      />
    </g>
  );
}

function Floor() {
  const text = 90 * S;
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={styles.dSvg}
      role="img"
      aria-label="On the page: the text on the left and the cabinet scaled down into its slot on the right."
    >
      <rect
        x={0.5}
        y={0.5}
        width={VIEW.w - 1}
        height={VIEW.h - 1}
        rx={6}
        className={styles.dPage}
      />
      {/* The header. */}
      <line
        x1={0}
        x2={VIEW.w}
        y1={56 * S}
        y2={56 * S}
        className={styles.dRule}
      />
      <rect
        x={text}
        y={22 * S}
        width={110 * S}
        height={12 * S}
        className={styles.dAccentFill}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={(760 + i * 84) * S}
          y={24 * S}
          width={60 * S}
          height={8 * S}
          className={styles.dFaintFill}
        />
      ))}
      {/* The name, the line of range, the status, two calls to action. */}
      <rect
        x={text}
        y={300 * S}
        width={330 * S}
        height={46 * S}
        rx={1}
        className={styles.dInk}
      />
      <rect
        x={text}
        y={372 * S}
        width={400 * S}
        height={18 * S}
        className={styles.dFaintFill}
      />
      <rect
        x={text}
        y={400 * S}
        width={350 * S}
        height={18 * S}
        className={styles.dFaintFill}
      />
      <rect
        x={text}
        y={450 * S}
        width={240 * S}
        height={12 * S}
        className={styles.dFaintFill}
      />
      <rect
        x={text}
        y={494 * S}
        width={120 * S}
        height={40 * S}
        rx={1.5}
        className={styles.dOutlineAccent}
      />
      <rect
        x={text + 134 * S}
        y={494 * S}
        width={110 * S}
        height={40 * S}
        rx={1.5}
        className={styles.dOutline}
      />
      <rect
        x={slot.x - 2}
        y={slot.y - 2}
        width={slot.w + 4}
        height={slot.h + 4}
        rx={3}
        className={styles.dSlot}
      />
      <Console box={slot} screen="attract" />
    </svg>
  );
}

function Zoomed() {
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={styles.dSvg}
      role="img"
      aria-label="Open: the background is dark and the same cabinet fills the screen at full size. Its container is still fixed where the slot is."
    >
      <g className="cabinet-scope">
        <rect
          x={0.5}
          y={0.5}
          width={VIEW.w - 1}
          height={VIEW.h - 1}
          rx={6}
          className={styles.dRoom}
        />
      </g>
      <Console box={zoomed} screen="list" />
      <g className="cabinet-scope">
        <rect
          x={slot.x - 2}
          y={slot.y - 2}
          width={slot.w + 4}
          height={slot.h + 4}
          rx={3}
          className={styles.dStage}
        />
      </g>
    </svg>
  );
}

export default function MachineDiagram() {
  return (
    <figure className={styles.diagram}>
      <div className={styles.panels}>
        <p className={`${styles.panelTitle} ${styles.areaTitleA}`}>
          On the page
        </p>
        <div className={styles.areaDrawA}>
          <Floor />
        </div>
        <div className={`${styles.panelLabels} ${styles.areaLabelsA}`}>
          <code className={styles.panelCode}>transform: scale(k)</code>
          <p className={styles.panelNote}>
            k is the slot width divided by the layout width: {K.toFixed(2)} at
            this size.
          </p>
        </div>
        <p className={styles.panelArrow} aria-hidden="true">
          <span>one transform</span>
          <svg viewBox="0 0 48 12" className={styles.arrowAcross}>
            <path d="M1 6 H41" />
            <path d="M37 1.5 L46 6 L37 10.5" />
          </svg>
          <svg viewBox="0 0 12 36" className={styles.arrowDown}>
            <path d="M6 1 V29" />
            <path d="M1.5 25 L6 34 L10.5 25" />
          </svg>
        </p>
        <p className={`${styles.panelTitle} ${styles.areaTitleB}`}>Open</p>
        <div className={styles.areaDrawB}>
          <Zoomed />
        </div>
        <div className={`${styles.panelLabels} ${styles.areaLabelsB}`}>
          <code className={styles.panelCode}>transform: translate(cover)</code>
          <p className={styles.panelNote}>
            The container stays fixed at the slot (dashed line), and the cabinet
            is translated from there to fill the screen.
          </p>
        </div>
      </div>
      <figcaption className={styles.caption}>
        Drawn to scale for a 1280 × 800 screen. The cabinet has the same layout
        in both states: as wide as the viewport up to 900 pixels, and as tall.
        Only its transform changes, so nothing inside it is laid out again and
        nothing else on the page moves.
      </figcaption>
    </figure>
  );
}
