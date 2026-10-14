import type { UiLocale } from "@/lib/i18n";

/** Chrome copy for the crypto-exchange admin mount (`/exchange`). No Vantage branding. */
export function exchangeShellCopy(locale: UiLocale) {
  if (locale === "zh-Hant") {
    return {
      brandEyebrow: "加密交易所",
      brandTitle: "風險控制平面",
      brandSub: "集中式加密交易所風險管理",
      headerEyebrow: "交易所風險控制平面",
      headerTitle: "風險 · 營運 · AI · 系統",
      messenger: "Messenger",
      indicators: "指標",
      signOut: "登出",
      signIn: "登入",
      publicMode: "公開原型",
      menu: "選單",
      language: "語言",
      unread: "未讀",
    };
  }
  return {
    brandEyebrow: "Crypto Exchange",
    brandTitle: "Risk Control Plane",
    brandSub: "Centralised crypto-exchange risk management",
    headerEyebrow: "Exchange Risk Control Plane",
    headerTitle: "Risk · Ops · AI · System",
    messenger: "Messenger",
    indicators: "Indicators",
    signOut: "Sign out",
    signIn: "Sign in",
    publicMode: "Public prototype",
    menu: "Menu",
    language: "Language",
    unread: "unread",
  };
}

/**
 * Visible-text replacements applied only under `/exchange`.
 * Longest keys first. Never touches the `/admin` tree.
 */
export const EXCHANGE_TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["Vantage Markets Admin logs", "Exchange Admin logs"],
  ["Vantage Markets 管理日誌", "交易所管理日誌"],
  ["Vantage Markets Admin", "Exchange Admin"],
  ["Vantage Markets 管理", "交易所管理"],
  ["Vantage Markets", "Crypto Exchange"],
  ["Yes, send to Vantage admin", "Yes, send to exchange admin"],
  ["是，送至 Vantage 管理後台", "是，送至交易所管理後台"],
  ["send to Vantage admin", "send to exchange admin"],
  ["送到 Vantage admin", "送到交易所管理後台"],
  ["Vantage admin", "exchange admin"],
  ["Vantage 管理後台", "交易所管理後台"],
  ["Vantage 管理", "交易所管理"],
  ["across CFD and crypto exchange products", "across crypto exchange products"],
  ["涵蓋 CFD 與加密交易所", "涵蓋加密交易所"],
  ["CFD + Crypto Exchange", "Crypto Exchange"],
  ["CFD＋加密交易所", "加密交易所"],
  ["CFD + Crypto", "Crypto Exchange"],
  ["CFD＋加密", "加密交易所"],
  ["CFD and Crypto", "Crypto Exchange"],
  ["CFD 與 Crypto", "加密交易所"],
  ["CFD vs Exchange", "Exchange"],
  ["CFD 對交易所", "交易所"],
  ["CFD vs Crypto", "Crypto Exchange"],
  ["Daily CFD / Exchange performance", "Daily crypto-exchange performance"],
  ["CFD sphere vs Exchange sphere", "Exchange sphere"],
  ["CFD 圈對交易所圈", "交易所圈"],
  ["forex CFD and the crypto exchange", "the crypto exchange"],
  ["外匯 CFD 與加密交易所", "加密交易所"],
  ["CFD book", "exchange book"],
  ["CFD 帳簿", "交易所帳簿"],
  ["retail CFD", "crypto exchange"],
  ["零售 CFD", "加密交易所"],
  ["CFD/", "Exchange/"],
  ["/CFD", "/Exchange"],
  [" CFD ", " exchange "],
  [" CFD", " exchange"],
  ["CFD ", "Exchange "],
  ["（CFD", "（交易所"],
  ["(CFD", "(Exchange"],
];

export function applyExchangeText(input: string): string {
  let out = input;
  for (const [from, to] of EXCHANGE_TEXT_REPLACEMENTS) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}
