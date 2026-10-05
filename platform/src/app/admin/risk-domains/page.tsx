import { getDb } from "@/lib/db";
import { DeptBadge, Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import { EnZh } from "@/components/EnZh";
import { cn } from "@/lib/utils";

type Domain = {
  id: number;
  code: string;
  name: string;
  description: string;
  owner_department: string;
  supporting_departments_json: string;
  product_coverage: string;
  priority: number;
  status: string;
};

function inCfd(coverage: string) {
  const v = coverage.toLowerCase();
  return v.includes("cfd") || v === "platform";
}

function inExchange(coverage: string) {
  const v = coverage.toLowerCase();
  return v.includes("crypto") || v === "platform";
}

function DomainCard({ d, tone }: { d: Domain; tone: "cfd" | "ex" }) {
  const supporting = JSON.parse(d.supporting_departments_json) as string[];
  return (
    <article
      className={cn(
        "rounded-2xl border p-4 bg-white/80",
        tone === "cfd" ? "border-teal-200" : "border-violet-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--muted)]">
            P{d.priority} · <Phrase>{d.code}</Phrase>
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg mt-0.5">
            <Phrase>{d.name}</Phrase>
          </h3>
        </div>
        <Badge
          className={
            tone === "cfd"
              ? "bg-teal-50 text-teal-900 border-teal-200"
              : "bg-violet-50 text-violet-900 border-violet-200"
          }
        >
          <Phrase>{d.product_coverage}</Phrase>
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <Phrase>{d.description}</Phrase>
      </p>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[var(--muted)]">
          <T k="common.owner" />
        </span>
        <DeptBadge code={d.owner_department} />
        <span className="text-xs text-[var(--muted)] ml-2">
          <T k="common.supporting" />
        </span>
        {supporting.map((s) => (
          <DeptBadge key={s} code={s} />
        ))}
      </div>
    </article>
  );
}

function Sphere({
  tone,
  titleEn,
  titleZh,
  hintEn,
  hintZh,
  domains,
}: {
  tone: "cfd" | "ex";
  titleEn: string;
  titleZh: string;
  hintEn: string;
  hintZh: string;
  domains: Domain[];
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 sm:p-5",
        tone === "cfd"
          ? "border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white"
          : "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-2xl",
          tone === "cfd" ? "bg-teal-300" : "bg-violet-300"
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.14em]",
              tone === "cfd" ? "text-teal-800" : "text-violet-800"
            )}
          >
            <EnZh en={tone === "cfd" ? "Sphere 1" : "Sphere 2"} zh={tone === "cfd" ? "第一圈" : "第二圈"} />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mt-1">
            <EnZh en={titleEn} zh={titleZh} />
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            <EnZh en={hintEn} zh={hintZh} />
          </p>
        </div>
        <span
          className={cn(
            "hidden sm:inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
            tone === "cfd" ? "bg-teal-600" : "bg-violet-600"
          )}
        >
          {domains.length}
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        {domains.map((d) => (
          <DomainCard key={`${tone}-${d.id}`} d={d} tone={tone} />
        ))}
      </div>
    </section>
  );
}

export default function RiskDomainsPage() {
  const domains = getDb().prepare(`SELECT * FROM risk_domains ORDER BY priority, name`).all() as Domain[];
  const cfd = domains.filter((d) => inCfd(d.product_coverage));
  const exchange = domains.filter((d) => inExchange(d.product_coverage));

  return (
    <div>
      <AdminPageHeader pageKey="risk-domains" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Sphere
          tone="cfd"
          titleEn="CFD"
          titleZh="CFD"
          hintEn="OTC book: pricing, credit, hedge, product conditions and ops that sit on the CFD stack."
          hintZh="OTC 帳簿：定價、信貸、對沖、商品條件與坐落在 CFD 堆疊的營運。"
          domains={cfd}
        />
        <Sphere
          tone="ex"
          titleEn="Exchange"
          titleZh="交易所"
          hintEn="Crypto matching, wallets, liquidations and the shared domains that also hit the exchange."
          hintZh="加密撮合、錢包、強平，以及同樣打到交易所的共用領域。"
          domains={exchange}
        />
      </div>
    </div>
  );
}
