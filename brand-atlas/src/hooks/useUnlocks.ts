import { useEffect, useState } from "react";
import {
  getUnlocks,
  isUnlocked,
  subscribeUnlocks,
  unlockCount,
  unlockItem,
  type UnlockRecord,
} from "../lib/unlocks";

export function useUnlocks() {
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeUnlocks(() => setVersion((v) => v + 1)), []);

  return {
    version,
    count: unlockCount(),
    unlocks: getUnlocks(),
    isUnlocked: (id: string) => isUnlocked(id),
    unlock: (id: string, method?: UnlockRecord["method"]) => unlockItem(id, method),
  };
}
