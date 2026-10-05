import { redirect } from "next/navigation";

/** Teams merged into BU and Teams hub at /admin/departments. */
export default function TeamsPage() {
  redirect("/admin/departments");
}
