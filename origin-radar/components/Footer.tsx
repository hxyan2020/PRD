import { CATALOG_AS_OF } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-8 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
      Snapshot {CATALOG_AS_OF} · 1688 / Pinduoduo / Alibaba · Google · TikTok · Xiaohongshu · NA · SEA · EU
    </footer>
  );
}
