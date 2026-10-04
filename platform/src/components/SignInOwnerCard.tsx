"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EnZh } from "@/components/EnZh";
import { VantageMark } from "@/components/VantageLogo";
import { PLATFORM_OWNER } from "@/lib/platform-owner";
import { defaultPersona, readDemoSession, signInPersona } from "@/lib/demo-session";
import { useEffect, useState } from "react";

/** Owner card on Admin Home — signs in immediately, never leaves `/admin`. */
export function SignInOwnerCard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const me = readDemoSession();
    setSignedIn(!!me && me.role_code !== "PUBLIC_GUEST");
  }, []);

  async function onSignIn() {
    setBusy(true);
    await signInPersona(defaultPersona());
    setSignedIn(true);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignIn}
      disabled={busy}
      className="panel card-link group p-4 flex items-center justify-between gap-3 text-left w-full"
    >
      <div className="min-w-0 flex items-start gap-3">
        <VantageMark className="h-11 w-11 mt-0.5" />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <EnZh en={PLATFORM_OWNER.titleEn} zh={PLATFORM_OWNER.titleZh} />
          </div>
          <div className="font-semibold text-lg mt-0.5">{defaultPersona().name}</div>
          <div className="text-sm text-[var(--muted)] break-word">{defaultPersona().email}</div>
          <div className="mt-2 text-xs font-semibold text-teal-800">
            {signedIn ? (
              <EnZh en="Signed in — session stays in this browser" zh="已登入 — 工作階段保留在此瀏覽器" />
            ) : busy ? (
              <EnZh en="Signing in…" zh="登入中…" />
            ) : (
              <EnZh en="Sign in and stay on this desk" zh="登入並留在此後台" />
            )}
          </div>
        </div>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
        aria-hidden
      />
    </button>
  );
}
