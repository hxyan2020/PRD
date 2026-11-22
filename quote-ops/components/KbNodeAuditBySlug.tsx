"use client";

import { useEffect, useState } from "react";
import { KbPageAudit } from "@/components/KbPageAudit";
import type { KbNode } from "@/lib/kb/types";

/** Load KB node by slug/id and render creation/update + full edit log. */
export function KbNodeAuditBySlug({ slug }: { slug: string }) {
  const [node, setNode] = useState<KbNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/kb/${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { node: KbNode };
        if (!cancelled) setNode(data.node);
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!node) return null;
  return (
    <KbPageAudit
      nodeId={node.id}
      createdAt={node.createdAt}
      updatedAt={node.updatedAt}
      createdBy={node.createdBy}
      updatedBy={node.updatedBy}
    />
  );
}
