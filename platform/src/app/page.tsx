import Link from "next/link";
import { redirect } from "next/navigation";
import { isStaticExport, publicAdminHref } from "@/lib/static-export";
import { VantageLogo } from "@/components/VantageLogo";
import { T } from "@/components/T";

export default function HomePage() {
  if (!isStaticExport()) redirect("/admin");
  const href = publicAdminHref("/admin/");
  return (
    <main className="min-h-screen grid place-items-center p-8 text-white" style={{ backgroundColor: "#044855" }}>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <div className="text-center">
        <VantageLogo inverted markClassName="h-16 w-16 mx-auto" className="justify-center" />
        <p className="mt-4">
          <Link className="text-white underline" href="/admin">
            <T k="common.openAdmin" />
          </Link>
        </p>
      </div>
    </main>
  );
}
