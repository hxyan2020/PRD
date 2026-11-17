export async function register() {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" || process.env.STATIC_EXPORT === "1") return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMarketIntelScheduler, seedMarketIntel } = await import("@/lib/market-intel/scanner");
    // Ensure schema/settings exist before first tick
    try {
      seedMarketIntel();
    } catch (e) {
      console.error("[market-intel] seed on boot failed", e);
    }
    startMarketIntelScheduler();
  }
}
