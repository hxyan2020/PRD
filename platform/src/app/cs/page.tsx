import { CsClientPortal } from "@/components/CsClientPortal";
import { isStaticExport } from "@/lib/static-export";

export default function CsPortalPage() {
  return <CsClientPortal staticMode={isStaticExport()} />;
}
