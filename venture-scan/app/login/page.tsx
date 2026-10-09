import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Log in · VentureScan",
  description: "Log in with email and password to collect ideas and matching analysis.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
