import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvidenceBySlug } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeeded();
  const { slug } = await params;
  const item = await getEvidenceBySlug(slug);
  if (!item || item.status !== "published") notFound();

  return (
    <article className="pt-4 sm:pt-8">
      <Link
        href="/evidence"
        className="font-mono text-[11px] uppercase tracking-wider text-mist hover:text-signal"
      >
        ← Evidence
      </Link>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
        {item.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-ink-soft">{item.summary}</p>

      <dl className="mt-6 grid gap-3 font-mono text-xs uppercase tracking-wider text-mist sm:grid-cols-3">
        <div>
          <dt>Sources</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{item.sourceCount}</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
            {item.languages.join(", ")}
          </dd>
        </div>
        <div>
          <dt>First seen</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-ink">
            {new Date(item.firstSeenAt).toLocaleDateString("en-SG", {
              timeZone: "Asia/Singapore",
            })}
          </dd>
        </div>
      </dl>

      {item.detail ? (
        <p className="mt-8 max-w-3xl whitespace-pre-wrap leading-relaxed text-ink-soft">
          {item.detail}
        </p>
      ) : null}

      <section className="mt-10 border-t border-line/80 pt-6">
        <h2 className="font-display text-2xl text-ink">Categories</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {item.categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                className="inline-flex border border-line px-3 py-2 text-sm text-ink transition hover:border-signal hover:text-signal"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-line/80 pt-6">
        <h2 className="font-display text-2xl text-ink">Sources</h2>
        <ul className="mt-4 divide-y divide-line/70 border-y border-line/70">
          {item.sources.map((source) => (
            <li key={source.id} className="py-4">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-signal hover:underline"
              >
                {source.title || source.url}
              </a>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mist">
                {source.publisher || "web"} · {source.language}
              </p>
              {source.snippet ? (
                <p className="mt-2 text-sm text-ink-soft">{source.snippet}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
