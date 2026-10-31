import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/** Copy `[id]` export folders to `%5Bid%5D` so hosts that don't decode brackets still find chunks. */
export function mirrorEncodedBrackets(root: string): void {
  for (const name of readdirSync(root)) {
    const full = path.join(root, name);
    if (!statSync(full).isDirectory()) continue;
    if (/\[.+\]/.test(name)) {
      const encoded = name.replaceAll("[", "%5B").replaceAll("]", "%5D");
      const dest = path.join(root, encoded);
      if (!existsSync(dest)) cpSync(full, dest, { recursive: true });
    }
    mirrorEncodedBrackets(full);
  }
}
