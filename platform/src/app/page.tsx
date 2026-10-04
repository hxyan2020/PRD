import Link from "next/link";
import { redirect } from "next/navigation";
import { isStaticExport, publicAdminHref } from "@/lib/static-export";

export default function HomePage() {
  if (!isStaticExport()) redirect("/admin");
  const href = publicAdminHref("/admin/");
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <p>
        <Link className="text-teal-800 underline" href="/admin">
          Open CRMP Admin
        </Link>
      </p>
    </main>
  );
}
