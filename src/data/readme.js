import README_CONTENT from "./readme-content.generated.json";

// A project with its README's word on what it is (scripts/sync-readmes.mjs
// decides, field by field, against docs/README-STANDARD.md; the card line
// waits for the whole README to meet the standard). Only the readout and the
// noscript list read these fields, so the first screen does not load them.
// The readout sets the outcome as its headline, and a README's lead opens
// with that same sentence, so the body leaves out what the headline already
// says. Nothing else in the body changes.
export function bodyAfterHeadline(desc, outcome) {
  if (!desc || !outcome) return desc;
  const body = desc.trim();
  const headline = outcome.trim();
  return body.startsWith(headline) ? body.slice(headline.length).trim() : desc;
}

export const withReadme = (project) => {
  const c = README_CONTENT[project.id];
  if (!c) return project;
  return {
    ...project,
    outcome: c.summary || project.outcome,
    desc: c.desc || project.desc,
    operatorNote: c.operatorNote || project.operatorNote,
    readmeStatus: c.status,
    readmeStatusNote: c.statusNote,
  };
};
