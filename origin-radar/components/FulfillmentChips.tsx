import type { FactoryLogistics } from "@/lib/storefront-types";

export function FulfillmentChips({ logistics }: { logistics: FactoryLogistics }) {
  const oem = [logistics.oemLogo && "logo", logistics.oemColor && "color", logistics.oemPackaging && "box"].filter(
    Boolean,
  );
  const overseas =
    logistics.overseasMode === "factory-ddp"
      ? "Factory DDP overseas"
      : logistics.overseasMode === "agent-ddp"
        ? "Overseas via agent"
        : "EXW only · no overseas consignee";
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`chip ${oem.length ? "chip-signal" : ""}`}>
        {oem.length ? `OEM ${oem.join(" / ")} @ ${logistics.customMoq}` : "No OEM"}
      </span>
      <span className={`chip ${logistics.overseasRecipient ? "chip-signal" : "chip-gold"}`}>{overseas}</span>
      <span className={`chip ${logistics.sampleToOverseas ? "chip-signal" : ""}`}>
        {logistics.sampleToOverseas ? "Sample → overseas" : "China sample only"}
      </span>
      <span className={`chip ${logistics.dropshipParcel ? "chip-signal" : ""}`}>
        {logistics.dropshipParcel ? "Parcel dropship OK" : "Carton / 3PL only"}
      </span>
    </div>
  );
}
