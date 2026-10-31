import { redirect } from "next/navigation";

/** Spine log tab removed from nav — stage counts live on Admin Home. Bookmarks redirect. */
export default function SpinePage() {
  redirect("/admin");
}
