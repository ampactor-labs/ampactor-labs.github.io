// The only logo: an A drawn as two strokes with a sine wave through the
// crossbar and two serif feet — the amp and the wave. Cyan, with the phosphor
// bloom. Same geometry as the cabinet's marquee mark.
export default function AMark({
  size = 28,
  glow = true,
  title,
}: {
  size?: number;
  glow?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      style={
        glow
          ? { filter: "drop-shadow(0 0 6px rgba(0,229,255,0.45))" }
          : undefined
      }
    >
      {title ? <title>{title}</title> : null}
      <line x1="108" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
      <line x1="404" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
      <path
        d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
        stroke="#00E5FF"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="76" y1="408" x2="140" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
      <line x1="372" y1="408" x2="436" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
    </svg>
  );
}
