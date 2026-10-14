import { redirect } from "next/navigation";
import { EXCHANGE_MOUNT } from "@/lib/admin-mount";

export default function ExchangeSpinePage() {
  redirect(EXCHANGE_MOUNT);
}
