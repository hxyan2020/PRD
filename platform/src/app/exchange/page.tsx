import Link from "next/link";
import AdminHomePage from "../admin/page";
import { EnZh } from "@/components/EnZh";
import { EXCHANGE_MOUNT } from "@/lib/admin-mount";
import { PUBLIC_EXCHANGE_URL } from "@/lib/static-export";

/**
 * Crypto-exchange home — reuses the live admin desk data/widgets, with a
 * crypto-first banner. Broker logo / CFD chrome are stripped by ExchangeMountGuards.
 * Canonical public URL is the GitHub Pages snapshot.
 */
export default async function ExchangeHomePage(props: {
  searchParams?: Promise<{ dummy?: string }>;
}) {
  return (
    <div className="space-y-4" data-testid="exchange-home">
      <section className="panel p-4 border-teal-200 bg-teal-50/40 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-teal-900">
          <EnZh en="Crypto Exchange Risk Control Plane" zh="加密交易所風險控制平面" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          <EnZh
            en="Desk focused on wallets, matching, liquidations and exchange book risk"
            zh="聚焦熱錢包、撮合、強平與交易所帳簿風險的台面"
          />
        </h1>
        <p className="text-sm text-teal-950 max-w-3xl">
          <EnZh
            en="Permanent public desk on GitHub Pages — no broker logo and no CFD-broker branding. The original /admin desk is unchanged."
            zh="永久公開台面（GitHub Pages）— 無券商標誌、無 CFD 券商品牌文案。原 /admin 台面未改動。"
          />
        </p>
        <p className="text-sm">
          <a
            className="text-teal-900 underline break-all font-medium"
            href={PUBLIC_EXCHANGE_URL}
            data-testid="exchange-public-url"
          >
            {PUBLIC_EXCHANGE_URL}
          </a>
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link className="btn btn-primary !min-h-9 text-xs" href={`${EXCHANGE_MOUNT}/dashboard`}>
            <EnZh en="Daily exchange performance" zh="每日交易所績效" />
          </Link>
          <Link className="btn !min-h-9 text-xs" href={`${EXCHANGE_MOUNT}/risk-domains`}>
            <EnZh en="Exchange risk domains" zh="交易所風險領域" />
          </Link>
          <Link className="btn !min-h-9 text-xs" href={`${EXCHANGE_MOUNT}/monitor-2`}>
            <EnZh en="Monitor 2.0" zh="Monitor 2.0" />
          </Link>
        </div>
      </section>
      <AdminHomePage {...props} />
    </div>
  );
}
