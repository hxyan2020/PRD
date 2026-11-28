import type { Evidence, EvidenceBody, LocaleCode } from "@/lib/types";

/** Present evidence text only in the viewer's selected language. */
export function presentEvidence(evidence: Evidence, locale: LocaleCode): {
  caption: string;
  body: EvidenceBody;
  available: boolean;
} {
  const pack = evidence.translations[locale];
  if (pack?.caption) {
    return { caption: pack.caption, body: pack.body, available: true };
  }
  if (evidence.language === locale) {
    return {
      caption: evidence.caption || evidence.summary,
      body: evidence.body,
      available: true,
    };
  }
  return {
    caption: "",
    body: { what: "", where: "", when: "", how: "", why: "" },
    available: false,
  };
}
