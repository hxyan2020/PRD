export type RiskClass = "H" | "T" | "A" | "M";
export type Frequency = "F1" | "F2" | "F3" | "F4";
export type Severity = "P0" | "P1" | "P2" | "P3";

export type RiskCategory =
  | "healthy"
  | "pricing"
  | "account"
  | "market"
  | "fraud"
  | "framework";

export type RiskScenario = {
  id: number;
  slug: string;
  title: string;
  titleZh: string;
  category: RiskCategory;
  classes: RiskClass[];
  frequency: Frequency;
  severity: Severity;
  howItWorks: string;
  howItWorksZh: string;
  detect: string[];
  detectZh: string[];
  prevent: string[];
  preventZh: string[];
  owners: string[];
  tags: string[];
};

export type KnowledgeChunk = {
  id: string;
  title: string;
  titleZh: string;
  section: string;
  sectionZh: string;
  kind: "article" | "risk" | "skill" | "pipeline" | "database" | "playbook";
  body: string;
  bodyZh: string;
  tags: string[];
  href: string;
};

export type PipelineStage = {
  id: string;
  name: string;
  nameZh: string;
  role: string;
  roleZh: string;
  inputs: string[];
  outputs: string[];
  failureModes: string[];
  failureModesZh: string[];
  checks: string[];
  checksZh: string[];
  systems: string[];
};

export type DbSystem = {
  id: string;
  name: string;
  nameZh: string;
  purpose: string;
  purposeZh: string;
  engine: string;
  hostPlaceholder: string;
  portPlaceholder: string;
  schemaNotes: string;
  schemaNotesZh: string;
  keyTables: { name: string; description: string; descriptionZh: string }[];
  accessRoles: string[];
  owner: string;
};

export type SkillStep = {
  id: string;
  title: string;
  titleZh: string;
  detail: string;
  detailZh: string;
  queryHint?: string;
  queryHintZh?: string;
};

export type Skill = {
  id: string;
  slug: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  severity: Severity;
  owners: string[];
  relatedRiskIds: number[];
  triggers: string[];
  triggersZh: string[];
  steps: SkillStep[];
  evidence: string[];
  evidenceZh: string[];
  tags: string[];
};

export type InvestigationCase = {
  id: string;
  title: string;
  symbol: string;
  status: "open" | "monitoring" | "resolved";
  severity: Severity;
  notes: string;
  skillId?: string;
  riskIds: number[];
  createdAt: string;
  updatedAt: string;
};
