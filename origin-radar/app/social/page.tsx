import Link from "next/link";
import { socialFeed } from "@/lib/catalog";
import { compact } from "@/lib/format";

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  xiaohongshu: "Xiaohongshu",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
};

export default function SocialPage() {
  const posts = socialFeed();
  return (
    <div>
      <p className="kicker">Social radar</p>
      <h1 className="mt-2 font-serif text-5xl">What TikTok, Xiaohongshu, and X are talking about</h1>
      <p className="mt-4 max-w-2xl text-paper/75">
        Recent public chatter tied to factory-hot SKUs. Rising mentions in China often lead Western
        search by 2–8 weeks — the window this desk is built to catch.
      </p>
      <div className="mt-10 space-y-4">
        {posts.map((p) => (
          <article key={p.author + p.time + p.productSlug} className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-mist">
                {platformLabel[p.platform] ?? p.platform} · {p.time} · {p.author}
              </p>
              <Link href={`/products/${p.productSlug}`} className="chip chip-rust">
                {p.productName}
              </Link>
            </div>
            <p className="mt-3 font-serif text-2xl leading-snug">“{p.text}”</p>
            <p className="mt-3 text-sm text-mist">
              {compact(p.likes)} likes · {p.trend} · {p.hashtags.slice(0, 4).join(" ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
