const NESTED_VIEWS = new Set(["entities", "sources", "regulation", "risk-tools"]);

export function vendorLogoId(vendor: string): string {
  return `vendor-${vendor
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function toolLogoId(toolId: string): string {
  return `tool-${toolId}`;
}

export function logoHref(id: string, pathname = typeof window === "undefined" ? "/" : window.location.pathname): string {
  const file = `logos/${encodeURIComponent(id)}.png`;
  const leaf = pathname.replace(/\/+$/, "").split("/").filter(Boolean).at(-1) ?? "";
  return NESTED_VIEWS.has(leaf) ? `../${file}` : `./${file}`;
}
