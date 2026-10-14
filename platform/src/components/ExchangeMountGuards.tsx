"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EXCHANGE_MOUNT, rewriteAdminTarget } from "@/lib/admin-mount";
import { applyExchangeText } from "@/lib/exchange-brand";

/**
 * Keeps users inside `/exchange` when in-page links/redirects still point at `/admin`,
 * and scrubs Vantage / CFD chrome copy from visible text. Mounted only under `/exchange`.
 */
export function ExchangeMountGuards({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const t = ev.target as Element | null;
      const a = t?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const raw = a.getAttribute("href");
      if (!raw || raw.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(raw)) return;
      const next = rewriteAdminTarget(raw, EXCHANGE_MOUNT);
      if (next === raw) return;
      ev.preventDefault();
      ev.stopPropagation();
      router.push(next);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    const root = document.getElementById("exchange-mount-root");
    if (!root) return;

    const scrubNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (!text) return;
        const next = applyExchangeText(text);
        if (next !== text) node.nodeValue = next;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      if (el.closest?.("script,style,noscript,code,pre,textarea,input,option")) return;
      for (const attr of ["aria-label", "title", "placeholder", "alt"]) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        const next = applyExchangeText(v);
        if (next !== v) el.setAttribute(attr, next);
      }
      for (const child of Array.from(el.childNodes)) scrubNode(child);
    };

    scrubNode(root);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target) scrubNode(m.target);
        for (const n of Array.from(m.addedNodes)) scrubNode(n);
      }
    });
    mo.observe(root, { subtree: true, characterData: true, childList: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const root = document.getElementById("exchange-mount-root");
    if (!root) return;
    const hideMarks = () => {
      root.querySelectorAll(".vantage-mark").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    };
    hideMarks();
    const mo = new MutationObserver(hideMarks);
    mo.observe(root, { subtree: true, childList: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div id="exchange-mount-root" data-testid="exchange-admin-mount" className="contents">
      <style>{`#exchange-mount-root .vantage-mark{display:none!important}`}</style>
      {children}
    </div>
  );
}
