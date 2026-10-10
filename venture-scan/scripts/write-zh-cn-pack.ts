import { writeFileSync, mkdirSync } from "node:fs";
import { MESSAGES } from "../lib/i18n/messages";
import type { MessageKey } from "../lib/i18n/messages";
import { zhCNExtra } from "./zh-cn-extra";

mkdirSync("lib/i18n/packs", { recursive: true });

const en = MESSAGES.en;
const merged = { ...MESSAGES["zh-CN"], ...zhCNExtra };
const ordered: Record<string, string> = {};
for (const k of Object.keys(en) as MessageKey[]) {
  ordered[k] = merged[k] ?? en[k];
}
writeFileSync("lib/i18n/packs/zh-CN.json", JSON.stringify(ordered, null, 2) + "\n");
const same = (Object.keys(en) as MessageKey[]).filter((k) => ordered[k] === en[k]);
console.log("zh-CN keys", Object.keys(ordered).length, "sameAsEn", same);
