import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  loadCollection,
  subscribeCollection,
  type CollectionData,
} from "../lib/collection";
import { GameCard } from "../components/GameCard";
import { Footer } from "../components/Footer";
import { useI18n } from "../i18n";
import {
  loadContentI18n,
  localizeGame,
  localizeCategory,
  type ContentI18nCatalog,
} from "../lib/localizeContent";
import { flagForCountry, isoForCountry } from "../lib/countryFlags";
import { FlagIcon } from "../components/FlagIcon";
import { FilterSelect } from "../components/FilterSelect";

const PAGE_SIZE = 30;

export function CollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [catalog, setCatalog] = useState<ContentI18nCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const { t, locale } = useI18n();

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      Promise.all([loadCollection(), loadContentI18n().catch(() => null)])
        .then(([d, i18n]) => {
          if (!alive) return;
          setData(d);
          setCatalog(i18n);
        })
        .catch((e: Error) => {
          if (alive) setError(e.message);
        });
    };
    refresh();
    const unsub = subscribeCollection(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const countries = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.games.map((g) => g.originCountry))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = deferredQuery.trim().toLowerCase();
    return data.games.filter((g) => {
      if (category !== "all" && g.category !== category) return false;
      if (region !== "all" && g.originCountry !== region) return false;
      if (!q) return true;
      const localized = localizeGame(g, locale, catalog, t);
      const hay = [
        localized.name,
        localized.originCountry,
        localized.civilization,
        localized.description,
        localized.category,
        g.name,
        g.originCountry,
        g.description,
        g.category,
        ...g.variations.map((v) => v.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, deferredQuery, category, region, locale, catalog, t]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered
    .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    .map((g) => localizeGame(g, locale, catalog, t));

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: t("collection.allCategories") },
      ...(data?.meta.categories ?? []).map((c) => ({
        value: c,
        label: localizeCategory(c, locale, catalog),
      })),
    ],
    [data, locale, catalog, t],
  );

  const regionOptions = useMemo(
    () => [
      {
        value: "all",
        label: t("collection.allOrigins"),
        leading: (
          <FlagIcon iso={null} flag="🌍" className="select-flag" />
        ),
      },
      ...countries.map((c) => ({
        value: c,
        label: catalog?.locales[locale]?.countries[c] ?? c,
        leading: (
          <FlagIcon
            iso={isoForCountry(c)}
            flag={flagForCountry(c)}
            className="select-flag"
          />
        ),
      })),
    ],
    [countries, catalog, locale, t],
  );

  const regionLeading =
    region === "all" ? (
      <FlagIcon iso={null} flag="🌍" className="select-flag" />
    ) : (
      <FlagIcon
        iso={isoForCountry(region)}
        flag={flagForCountry(region)}
        className="select-flag"
      />
    );

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, category, region, locale]);

  if (error) {
    return (
      <div className="error">{t("collection.error", { error })}</div>
    );
  }

  if (!data) {
    return <div className="loading">{t("collection.loading")}</div>;
  }

  return (
    <>
      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("collection.title")}</h2>
            <p>
              {t("collection.sub", {
                n: data.meta.totalGames.toLocaleString(),
              })}
            </p>
          </div>

          <div className="filters">
            <div className="field">
              <label htmlFor="q">{t("collection.search")}</label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("collection.searchPlaceholder")}
              />
            </div>
            <FilterSelect
              id="cat"
              label={t("collection.category")}
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            />
            <FilterSelect
              id="region"
              label={t("collection.origin")}
              value={region}
              options={regionOptions}
              onChange={setRegion}
              triggerLeading={regionLeading}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setRegion("all");
              }}
            >
              {t("collection.reset")}
            </button>
          </div>

          <div className="meta-bar">
            <span>
              {t("collection.showing")}{" "}
              <strong>{filtered.length.toLocaleString()}</strong>{" "}
              {t("collection.matches")}
            </span>
            <span>
              {t("collection.page")} <strong>{safePage}</strong> / {pageCount}
            </span>
          </div>

          <div className="game-grid">
            {pageItems.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} />
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="pagination">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("collection.prev")}
              </button>
              {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                let n = i + 1;
                if (pageCount > 7) {
                  const start = Math.max(1, Math.min(safePage - 3, pageCount - 6));
                  n = start + i;
                }
                return (
                  <button
                    key={n}
                    type="button"
                    className={n === safePage ? "active" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                {t("collection.next")}
              </button>
            </div>
          ) : null}
        </div>
      </section>
      <Footer total={data.meta.totalGames} />
    </>
  );
}
