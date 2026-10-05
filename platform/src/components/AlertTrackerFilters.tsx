"use client";

import type { ReactNode } from "react";
import {
  DEFAULT_ALERT_FILTERS,
  type AlertFilterState,
  type AlertProductFilter,
  type AlertSeverityFilter,
  type AlertSortKey,
  type AlertTimeWindow,
  uniqueDomains,
} from "@/lib/alert-filters";
import type { AlertTrackerPack } from "@/lib/alert-tracker";
import { MonitorCode } from "@/components/MonitorCode";
import { useT } from "@/hooks/useUiLocale";

export function AlertTrackerFilters({
  packs,
  filters,
  onChange,
  resultCount,
  showUnresolved = true,
  extra,
}: {
  packs: AlertTrackerPack[];
  filters: AlertFilterState;
  onChange: (next: AlertFilterState) => void;
  resultCount: number;
  showUnresolved?: boolean;
  extra?: ReactNode;
}) {
  const { t, phrase } = useT();
  const domains = uniqueDomains(packs);

  function patch(partial: Partial<AlertFilterState>) {
    onChange({ ...filters, ...partial });
  }

  const selectClass = "input h-9 text-sm w-full min-w-0 sm:min-w-[9rem]";

  return (
    <div className="panel p-4 space-y-3" data-testid="alert-filters">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("alerts.filtersTitle")}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">{t("alerts.filtersHint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extra}
          <div className="text-sm tabular-nums text-[var(--muted)]" data-testid="alert-filter-count">
            {t("alerts.filterCount", { shown: resultCount, total: packs.length })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--muted)] min-w-0">
          {t("alerts.filterTime")}
          <select
            className={selectClass}
            value={filters.time}
            data-testid="alert-filter-time"
            onChange={(e) => patch({ time: e.target.value as AlertTimeWindow })}
          >
            <option value="all">{t("alerts.timeAll")}</option>
            <option value="24h">{t("alerts.time24h")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--muted)] min-w-0">
          {t("alerts.filterSeverity")}
          <select
            className={selectClass}
            value={filters.severity}
            data-testid="alert-filter-severity"
            onChange={(e) => patch({ severity: e.target.value as AlertSeverityFilter })}
          >
            <option value="all">{t("common.all")}</option>
            <option value="high">{t("alerts.sevHigh")}</option>
            <option value="medium">{t("alerts.sevMedium")}</option>
            <option value="low">{t("alerts.sevLow")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--muted)] min-w-0">
          {t("alerts.filterProduct")}
          <select
            className={selectClass}
            value={filters.product}
            data-testid="alert-filter-product"
            onChange={(e) => patch({ product: e.target.value as AlertProductFilter })}
          >
            <option value="all">{t("common.all")}</option>
            <option value="CFD">CFD</option>
            <option value="PERPS">{t("alerts.productPerps")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--muted)] min-w-0">
          {t("alerts.filterCategory")}
          <select
            className={selectClass}
            value={filters.domain}
            data-testid="alert-filter-domain"
            onChange={(e) => patch({ domain: e.target.value })}
          >
            <option value="all">{t("common.all")}</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {phrase(d)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--muted)] min-w-0 col-span-2 sm:col-span-1">
          {t("alerts.sortBy")}
          <select
            className={selectClass}
            value={filters.sort}
            data-testid="alert-filter-sort"
            onChange={(e) => patch({ sort: e.target.value as AlertSortKey })}
          >
            <option value="newest">{t("alerts.sortNewest")}</option>
            <option value="oldest">{t("alerts.sortOldest")}</option>
            <option value="severity_desc">{t("alerts.sortSevHigh")}</option>
            <option value="severity_asc">{t("alerts.sortSevLow")}</option>
            <option value="product">{t("alerts.sortProduct")}</option>
            <option value="domain">{t("alerts.sortCategory")}</option>
          </select>
        </label>

        {showUnresolved ? (
          <label className="flex items-center gap-2 h-9 px-1 text-sm font-medium cursor-pointer col-span-2 sm:col-span-1">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={filters.unresolvedOnly}
              data-testid="alert-filter-unresolved"
              onChange={(e) => patch({ unresolvedOnly: e.target.checked })}
            />
            {t("alerts.unresolvedOnly")}
          </label>
        ) : null}

        {filters.monitorId ? (
          <div
            className="flex flex-wrap items-center gap-2 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-2.5 py-1.5 col-span-2"
            data-testid="alert-filter-monitor"
          >
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {t("alerts.filterMonitor")}
              <MonitorCode id={filters.monitorId} />
            </span>
            <button
              type="button"
              className="underline font-semibold"
              onClick={() => patch({ monitorId: "" })}
            >
              {t("common.clear")}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="btn h-9 col-span-2 sm:col-span-1 w-full sm:w-auto"
          data-testid="alert-filter-reset"
          onClick={() => onChange({ ...DEFAULT_ALERT_FILTERS })}
        >
          {t("alerts.resetFilters")}
        </button>
      </div>
    </div>
  );
}
