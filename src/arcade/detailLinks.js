// The link rail of an open cartridge: its demo, then its source, unless the
// program names its own links. Kept apart from useCabinetState so the lazy
// readout can import it without sharing the hook's whole module graph (GSAP
// included) with the entry, which made Rolldown split them into a chunk of
// their own.
export function detailLinksOf(p) {
  if (!p) return [];
  if (p.links) return p.links;
  const links = [];
  // liveLabel overrides the pill text for demos that aren't pages —
  // 2-Top's slot serves an APK download, and the pill should say so.
  if (p.live) links.push({ kind: "live", href: p.live, label: p.liveLabel });
  if (p.github) links.push({ kind: "github", href: p.github });
  return links;
}
