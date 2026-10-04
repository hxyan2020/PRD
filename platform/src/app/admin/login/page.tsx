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
          en="Your account stays in this browser after Sign in. Default owner is YAN Haixiang (docs & platform owner). GitHub / Cursor or another demo role also work."
          zh="登入後帳號會留在這個瀏覽器。預設負責人為 YAN Haixiang（文件與平台負責人）。也可用 GitHub／Cursor 或其他示範角色。"
        />
      </p>
      <LoginForm compact />
    </div>
  );
}
