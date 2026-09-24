// Shapes of the shared data. projects.js and profile.js stay JavaScript
// (scripts read them by path); the typed surfaces import these to read them.

export type ProjectCategory =
  | "systems"
  | "web3"
  | "security"
  | "creative"
  | "defi"
  | "tooling";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  lang: string;
  color: string;
  icon: string;
  github: string | null;
  live?: string;
  liveLabel?: string;
  desc: string;
  tags: string[];
  tagline: string;
  outcome: string;
  highlights: string[];
  stack: string[];
  status: string;
  category: ProjectCategory;
  operatorNote?: string;
  readmeStatus?: string;
  readmeStatusNote?: string;
}

export interface ResumeRole {
  org: string;
  role: string;
  location: string;
  start: number;
  end: number | null;
  note?: string;
  bullets: string[];
}

export interface ResumeWork {
  id: string;
  name: string;
  what: string;
  stack: string;
  url: string;
}

export interface Resume {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  site: string;
  github: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experience: ResumeRole[];
  selectedWork: ResumeWork[];
  before: string;
}
