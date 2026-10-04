import { AdminPageHeader } from "@/components/AdminPageHeader";
import { LoginForm } from "@/components/LoginForm";
import { EnZh } from "@/components/EnZh";
import { VantageLogo } from "@/components/VantageLogo";

export default function AdminLoginPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <VantageLogo markClassName="h-12 w-12" />
      </div>
      <AdminPageHeader pageKey="login" />
      <p className="text-sm text-[var(--muted)] mb-4">
        <EnZh
          en="Your account stays in this browser after Sign in. Use Haixiang Yan (your GitHub / Cursor login) or another demo role."
          zh="登入後帳號會留在這個瀏覽器。可用 Haixiang Yan（你的 GitHub／Cursor 帳號）或其他示範角色。"
        />
      </p>
      <LoginForm compact />
    </div>
  );
}
