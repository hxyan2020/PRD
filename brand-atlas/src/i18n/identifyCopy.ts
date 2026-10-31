import type { MessageKey } from "./messages";
import type { IdentifyUnclearReason } from "../types/catalog";

const UNCLEAR_DETAIL: Record<IdentifyUnclearReason, MessageKey> = {
  dark: "scan.unclear.dark",
  blank: "scan.unclear.blank",
  noSignal: "scan.unclear.noSignal",
  ambiguous: "scan.unclear.ambiguous",
  failed: "scan.unclear.failed",
};

export function unclearDetailKey(
  reason?: IdentifyUnclearReason | null,
): MessageKey {
  return UNCLEAR_DETAIL[reason ?? "noSignal"] ?? "scan.unclear.noSignal";
}
