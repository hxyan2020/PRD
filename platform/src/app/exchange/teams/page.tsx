import { ClientRedirect } from "@/components/ClientRedirect";
import { isStaticExport } from "@/lib/static-export";
import { redirect } from "next/navigation";
import { EXCHANGE_MOUNT } from "@/lib/admin-mount";

export default function ExchangeTeamsPage() {
  const target = `${EXCHANGE_MOUNT}/departments`;
  if (isStaticExport()) return <ClientRedirect href={target} />;
  redirect(target);
}
