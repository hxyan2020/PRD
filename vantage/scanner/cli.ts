import { runScan } from "./scan";

runScan()
  .then((briefing) => {
    console.log(
      JSON.stringify(
        {
          window: briefing.meta.windowLabel,
          start: briefing.meta.windowStart,
          end: briefing.meta.windowEnd,
          items: briefing.meta.itemCount,
          sources: briefing.meta.sourceStats,
        },
        null,
        2,
      ),
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
