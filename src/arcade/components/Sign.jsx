import { pixel } from "../type";
// A sign: the label, then the sunset bar running out to the edge (Pit Viper's
// band, kept as one 3 px rule of cyan, violet and magenta). Every section
// heading on the tube hangs on it: the list's categories, a readout's
// sections, the operator programs' parts.
//
// On a readout or a program a sign is a real heading (`as="h2"`, the
// default), so a screen reader can walk the sections instead of hearing one
// block of text. The list's categories pass `as="div"`: a listbox may hold
// only its options.
export default function Sign({ text, fs, style, as: Tag = "h2" }) {
  return (
    <Tag
      className="sign"
      style={{ margin: 0, marginBottom: 8, fontSize: "inherit", fontWeight: "normal", ...style }}
    >
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: pixel(fs(7)),
          color: "var(--cab-muted)",
          letterSpacing: "var(--track-pixel)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <span className="sunset" aria-hidden="true" />
    </Tag>
  );
}
