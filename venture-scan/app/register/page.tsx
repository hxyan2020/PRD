import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Register · VentureScan",
  description: "Create an account with email and password to collect ideas and matching analysis.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
