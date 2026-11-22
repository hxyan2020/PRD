export type KbKind =
  | "folder"
  | "article"
  | "risk"
  | "skill"
  | "pipeline"
  | "database"
  | "custom";

export type KbStatus = "draft" | "published";

export type KbNode = {
  id: string;
  parentId: string | null;
  kind: KbKind;
  slug: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  bodyZh: string;
  bodyEn: string;
  sortOrder: number;
  tags: string[];
  payload: Record<string, unknown>;
  status: KbStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type KbRevision = {
  id: string;
  nodeId: string;
  action: string;
  actorSub: string;
  actorEmail: string;
  actorName: string;
  snapshot: Record<string, unknown>;
  note: string;
  createdAt: string;
};

export type KbMedia = {
  id: string;
  nodeId: string | null;
  name: string;
  mime: string;
  kind: string;
  dataUrl: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string;
};

export type KbNodeInput = {
  id?: string;
  parentId?: string | null;
  kind: KbKind;
  slug?: string;
  /** At least one of titleZh / titleEn required; missing side filled on publish. */
  titleZh?: string;
  titleEn?: string;
  summaryZh?: string;
  summaryEn?: string;
  bodyZh?: string;
  bodyEn?: string;
  sortOrder?: number;
  tags?: string[];
  payload?: Record<string, unknown>;
  status?: KbStatus;
  note?: string;
};

export type TreeNode = KbNode & { children: TreeNode[] };
