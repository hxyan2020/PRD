import { Suspense } from "react";
import { AuthAccount } from "@/components/AuthAccount";

export const metadata = {
  title: "Account · VentureScan",
  description: "Create an account or manage your VentureScan session.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AuthAccount />
    </Suspense>
  );
}
