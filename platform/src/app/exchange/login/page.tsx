import { AdminPageHeader } from "@/components/AdminPageHeader";
import { LoginForm } from "@/components/LoginForm";
import { EnZh } from "@/components/EnZh";

/** Exchange-mount sign-in — no Vantage logo. */
export default function ExchangeLoginPage() {
  return (
    <div className="max-w-lg" data-testid="exchange-login">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-teal-800">
          <EnZh en="Crypto Exchange" zh="加密交易所" />
        </div>
        <div className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          <EnZh en="Risk Control Plane" zh="風險控制平面" />
        </div>
      </div>
      <AdminPageHeader pageKey="login" />
      <p className="text-sm text-[var(--muted)] mb-4">
        <EnZh
          en="Sign in for the crypto-exchange risk desk. Your account stays in this browser. Default owner is demo platform owner."
          zh="登入加密交易所風險台面。帳號會留在這個瀏覽器。預設負責人為示範平台負責人。"
        />
      </p>
      <LoginForm compact />
    </div>
  );
}
