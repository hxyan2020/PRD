import fs from "node:fs/promises";
import path from "node:path";

export function sourcedRoot(publicDir = path.join(process.cwd(), "public")): string {
  return path.resolve(publicDir, "sourced");
}

export function resolveSourcedPath(parts: string[], publicDir?: string): string | null {
  if (parts.length === 0 || parts.some((p) => !p || p.includes("..") || p.includes("/") || p.includes("\\"))) {
    return null;
  }
  const root = sourcedRoot(publicDir);
  const resolved = path.resolve(root, ...parts);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export async function readSourcedFile(parts: string[]): Promise<{ body: Buffer; contentType: string } | null> {
  const file = resolveSourcedPath(parts);
  if (!file) return null;
  try {
    const body = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
    return { body, contentType };
  } catch {
    return null;
  }
}
