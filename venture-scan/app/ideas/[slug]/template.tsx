/**
 * Remount the dossier on every slug change so ScrollToTop always re-runs
 * (App Router layouts alone can keep the previous scroll offset).
 */
export default function IdeaSlugTemplate({ children }: { children: React.ReactNode }) {
  return children;
}
