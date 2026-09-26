import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  Briefing,
  CatalogMeta,
  Entity,
  RiskTool,
} from "./types";

const DATA = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA, file), "utf8")) as T;
}

export async function loadEntities(): Promise<{
  banks: Entity[];
  brokers: Entity[];
  exchanges: Entity[];
  all: Entity[];
  meta: CatalogMeta;
}> {
  const [banks, brokers, exchanges, meta] = await Promise.all([
    readJson<Entity[]>("banks.json"),
    readJson<Entity[]>("brokers.json"),
    readJson<Entity[]>("exchanges.json"),
    readJson<CatalogMeta>("catalog-meta.json"),
  ]);
  return { banks, brokers, exchanges, all: [...banks, ...brokers, ...exchanges], meta };
}

export async function loadRiskTools(): Promise<RiskTool[]> {
  return readJson<RiskTool[]>("risk-tools.json");
}

export async function loadBriefing(): Promise<Briefing | null> {
  try {
    return await readJson<Briefing>("latest.json");
  } catch {
    return null;
  }
}

export function entityName(id: string, entities: Entity[]): string {
  return entities.find((entity) => entity.id === id)?.name ?? id;
}
