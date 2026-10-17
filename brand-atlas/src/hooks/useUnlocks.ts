import { useEffect, useState } from "react";
import {
  getUnlock,
  getUnlocks,
  isUnlocked,
  subscribeUnlocks,
  unlockCount,
  unlockItem,
  updateUnlockNote,
  updateUnlockPhoto,
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
    getUnlock: (id: string) => getUnlock(id),
    unlock: (
      id: string,
      opts?: {
        method?: UnlockRecord["method"];
        photoDataUrl?: string | null;
        note?: string;
      },
    ) => unlockItem(id, opts),
    updateNote: (id: string, note: string) => updateUnlockNote(id, note),
    updatePhoto: (id: string, photo: string | null) => updateUnlockPhoto(id, photo),
  };
}
