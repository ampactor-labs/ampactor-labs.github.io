// A sign: the label, then the sunset bar running out to the edge (Pit Viper's
// band, kept as one 3 px rule of cyan, violet and magenta). Every section
// heading on the tube hangs on it: the list's categories, a readout's
// sections, the operator programs' parts.
export default function Sign({ text, fs, style }) {
  return (
    <div className="sign" style={style}>
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: fs(7),
          color: "var(--cab-muted)",
          letterSpacing: "0.2em",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <div className="sunset" aria-hidden="true" />
    </div>
  );
}
