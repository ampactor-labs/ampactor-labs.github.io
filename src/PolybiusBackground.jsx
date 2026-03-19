const RINGS = [
  { r: 60,  color: "#00E5FF", opacity: 0.12, width: 1.5, dur: 80,  dir: 1  },
  { r: 100, color: "#00FFD0", opacity: 0.10, width: 1.2, dur: 65,  dir: -1 },
  { r: 150, color: "#00E5FF", opacity: 0.09, width: 1,   dur: 55,  dir: 1  },
  { r: 210, color: "#4488FF", opacity: 0.08, width: 1,   dur: 70,  dir: -1 },
  { r: 280, color: "#00FFD0", opacity: 0.08, width: 0.8, dur: 50,  dir: 1  },
  { r: 360, color: "#4488FF", opacity: 0.10, width: 1,   dur: 63,  dir: -1 },
  { r: 450, color: "#6644FF", opacity: 0.12, width: 1.2, dur: 75,  dir: 1  },
  { r: 550, color: "#00E5FF", opacity: 0.10, width: 1,   dur: 58,  dir: -1 },
  { r: 660, color: "#6644FF", opacity: 0.08, width: 0.8, dur: 85,  dir: 1  },
];

const DUST_COUNT = 50;
const VERTEX_RINGS = [0, 1, 2, 5, 6]; // inner + visible outer rings get dots

function pentagon(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function pentagonStr(cx, cy, r) {
  return pentagon(cx, cy, r).map(p => p.join(",")).join(" ");
}

function makeDust() {
  const particles = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    particles.push({
      cx: Math.random() * 1200,
      cy: Math.random() * 900,
      r: 0.4 + Math.random() * 1.4,
      opacity: 0.04 + Math.random() * 0.1,
      dur: 20 + Math.random() * 50,
      dx: -25 + Math.random() * 50,
    });
  }
  return particles;
}

const DUST = makeDust();
const CX = 500, CY = 450;

const polybiusStyles = `
  @keyframes polyRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes polyRotateRev { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes drift {
    0% { transform: translate(0, 0); }
    33% { transform: translate(var(--dx), -120px); }
    66% { transform: translate(calc(var(--dx) * -0.5), -240px); }
    100% { transform: translate(0, -500px); }
  }
  @keyframes vertexPulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
  @keyframes ringPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes spokeSweep { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
`;

export default function PolybiusBackground() {
  return (
    <>
      <style>{polybiusStyles}</style>
      <svg
        viewBox="0 0 1000 900"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.08" />
            <stop offset="20%" stopColor="#00E5FF" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#4488FF" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central reactor glow — large enough to reach past the cabinet */}
        <circle cx={CX} cy={CY} r="500" fill="url(#coreGlow)" />

        {/* Rotating radar sweep — like Aztarac */}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: "spokeSweep 20s linear infinite" }}>
          <line x1={CX} y1={CY} x2={CX + 700} y2={CY} stroke="#00E5FF" strokeWidth="1" opacity="0.04" />
          <line x1={CX} y1={CY} x2={CX - 700} y2={CY} stroke="#4488FF" strokeWidth="0.5" opacity="0.02" />
        </g>

        {/* Radial spokes — dashed lines from center outward, 5-fold symmetry */}
        {[0, 1, 2, 3, 4].map(i => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x2 = CX + 700 * Math.cos(a);
          const y2 = CY + 700 * Math.sin(a);
          return (
            <line key={`spoke-${i}`}
              x1={CX} y1={CY} x2={x2} y2={y2}
              stroke="#4488FF" strokeWidth="0.5" opacity="0.06"
              strokeDasharray="3 12"
            />
          );
        })}

        {/* Pentagon rings */}
        {RINGS.map((ring, i) => (
          <g key={`ring-${i}`}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              animation: `${ring.dir > 0 ? "polyRotate" : "polyRotateRev"} ${ring.dur}s linear infinite`,
            }}
          >
            <polygon
              points={pentagonStr(CX, CY, ring.r)}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.width}
              opacity={ring.opacity}
              style={i <= 2 || i >= 5 ? {
                animation: `ringPulse ${7 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 1.5}s`,
              } : undefined}
            />

            {/* Vertex glow dots */}
            {VERTEX_RINGS.includes(i) && pentagon(CX, CY, ring.r).map((pt, vi) => (
              <circle key={`v-${i}-${vi}`}
                cx={pt[0]} cy={pt[1]}
                r={i >= 5 ? 2.5 : 2 - i * 0.3}
                fill={ring.color}
                opacity={ring.opacity * 2}
                style={{
                  animation: `vertexPulse ${2.5 + vi * 0.6}s ease-in-out infinite`,
                  animationDelay: `${vi * 0.4}s`,
                }}
              />
            ))}
          </g>
        ))}

        {/* Connecting arcs between outer ring vertices — Star Castle shield feel */}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: "polyRotateRev 63s linear infinite" }}>
          {pentagon(CX, CY, 360).map((pt, i) => {
            const next = pentagon(CX, CY, 360)[(i + 1) % 5];
            const mx = (pt[0] + next[0]) / 2;
            const my = (pt[1] + next[1]) / 2;
            return <circle key={`arc-${i}`} cx={mx} cy={my} r="1.5" fill="#4488FF" opacity="0.08" />;
          })}
        </g>

        {/* Dust particles — varied colors */}
        {DUST.map((d, i) => (
          <circle key={`dust-${i}`}
            cx={d.cx} cy={d.cy} r={d.r}
            fill={i % 4 === 0 ? "#00FFD0" : i % 4 === 1 ? "#00E5FF" : i % 4 === 2 ? "#4488FF" : "#6644FF"}
            opacity={d.opacity}
            style={{
              "--dx": `${d.dx}px`,
              animation: `drift ${d.dur}s linear infinite`,
              animationDelay: `${-Math.random() * d.dur}s`,
            }}
          />
        ))}
      </svg>
    </>
  );
}
