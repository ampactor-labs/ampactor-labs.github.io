import { PROJECTS, HIDDEN_PROJECTS } from "../../data/projects";
import { SYSTEM_PROGRAMS } from "../../data/programs";

// Every id "/arcade/#<id>" may name: the cartridges, the operator's programs,
// and the hidden ones (a link straight to those drops the coin).
const KNOWN = new Set<string>(
  [...PROJECTS, ...HIDDEN_PROJECTS, ...SYSTEM_PROGRAMS].map((p) => p.id),
);

export const isKnownProgramId = (id: string): boolean => KNOWN.has(id);
