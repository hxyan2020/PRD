import { getProduct, getProducts } from "@/lib/catalog";
import { getDeskSnapshot, sourcedSlugMap } from "@/lib/db";
import { dailyQueue, todayKey } from "@/lib/desk";
import { QueueDesk } from "@/components/QueueDesk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function QueuePage() {
  const day = todayKey();
  const all = getProducts();
  const snap = getDeskSnapshot(day);
  const discardedSet = new Set(snap.discarded);
  const review = dailyQueue(all, discardedSet);
  const collected = snap.collected
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const discarded = snap.discarded
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <QueueDesk
      day={day}
      review={review}
      collected={collected}
      discarded={discarded}
      sourced={sourcedSlugMap()}
    />
  );
}
