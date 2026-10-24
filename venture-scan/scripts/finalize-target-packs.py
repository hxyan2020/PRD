#!/usr/bin/env python3
"""Build complete pt-BR, it, nl, ar, vi, th, tr packs from en/es with safe Argos translation."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import argostranslate.package
import argostranslate.translate

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / "lib/i18n/packs"

PLACEHOLDERS = ["count", "title", "score", "name", "stage", "day"]
PROTECT_TERMS = [
    ("VentureScan", "ZZVSZZ"),
    ("SQLite", "ZZSQLITEZZ"),
    (" skip", " ZZSKIPZZ"),
    ("skip ", "ZZSKIPZZ "),
    ("skip.", "ZZSKIPZZ."),
    ("skip,", "ZZSKIPZZ,"),
    ("type skip", "type ZZSKIPZZ"),
    ("→", "ZZARROWZZ"),
    ("B2B", "ZZB2BZZ"),
    ("API", "ZZAPIZZ"),
    ("Python", "ZZPYTHONZZ"),
]

TIME_BY_LOCALE: dict[str, dict[str, str]] = {
    "pt-BR": {
        "time.justNow": "agora mesmo",
        "time.minutesAgo": "há {count} min",
        "time.hoursAgo": "há {count} h",
        "time.daysAgo": "há {count} d",
    },
    "it": {
        "time.justNow": "proprio ora",
        "time.minutesAgo": "{count} min fa",
        "time.hoursAgo": "{count} h fa",
        "time.daysAgo": "{count} g fa",
    },
    "nl": {
        "time.justNow": "zojuist",
        "time.minutesAgo": "{count} min geleden",
        "time.hoursAgo": "{count} u geleden",
        "time.daysAgo": "{count} d geleden",
    },
    "ar": {
        "time.justNow": "الآن",
        "time.minutesAgo": "منذ {count} د",
        "time.hoursAgo": "منذ {count} س",
        "time.daysAgo": "منذ {count} ي",
    },
    "vi": {
        "time.justNow": "vừa xong",
        "time.minutesAgo": "{count} phút trước",
        "time.hoursAgo": "{count} giờ trước",
        "time.daysAgo": "{count} ngày trước",
    },
    "th": {
        "time.justNow": "เมื่อกี้",
        "time.minutesAgo": "{count} นาทีที่แล้ว",
        "time.hoursAgo": "{count} ชั่วโมงที่แล้ว",
        "time.daysAgo": "{count} วันที่แล้ว",
    },
    "tr": {
        "time.justNow": "az önce",
        "time.minutesAgo": "{count} dk önce",
        "time.hoursAgo": "{count} sa önce",
        "time.daysAgo": "{count} gün önce",
    },
}

MANUAL: dict[str, dict[str, str]] = {
    "it": {
        "nav.menu": "Menù",
        "match.topFits": "Migliori abbinamenti",
        "today.openMatch": "Apri chatbot di match",
        "auth.email": "E-mail",
        "auth.password": "Password",
        "method.mobileLabel": "Mobile",
        "sources.visit": "Apri fonte",
        "sources.health.stale": "Obsoleta",
        "sources.health.offline": "Non in linea",
        "common.people": "{count} persone",
    },
    "ar": {
        "nav.ideas": "الأفكار",
        "nav.match": "المطابقة",
        "nav.menu": "القائمة",
        "strategy.new_age_group": "استهداف فئة عمرية مختلفة",
        "match.rebuild": "إعادة بناء الملف",
        "auth.email": "البريد الإلكتروني",
        "method.scanLabel": "المسح",
        "method.storeLabel": "التخزين",
        "method.matchLabel": "المطابقة",
        "method.sourcesBefore": "يعرض",
        "method.urlLabel": "رابط دائم",
        "sources.health.degraded": "متدهور",
        "sources.health.stale": "قديم",
        "sources.health.offline": "غير متصل",
        "hero.browse": "تصفح {count} فكرة",
        "ledger.shown": "{count} معروضة",
        "ledger.funded": "ممولة · {stage}",
        "ledger.match": "تطابق {score}%",
        "sources.shown": "{count} معروضة",
        "ideaChat.welcome": "أنا مساعد الملف لـ {name}. اسأل عن التمويل أو الفريق أو نموذج العمل أو الخطة أو مصدر البيانات — سأستشهد بالمصادر في كل إجابة.",
    },
    "tr": {
        "nav.logout": "Çıkış yap",
        "nav.register": "Kayıt ol",
        "nav.close": "Kapat",
        "nav.menu": "Menü",
        "common.people": "{count} kişi",
        "common.yes": "Evet",
        "common.play": "Oynat",
        "common.source": "Kaynak",
        "strategy.b2b_pivot": "Yerleşik firmalara B2B olarak sun",
        "dossier.back": "← Deftere dön",
        "dossier.description": "(ii) Tam açıklama",
        "dossier.goForward": "(x) İleriye dönük hamle",
        "sourceKind.registry": "Kayıt",
        "sourceKind.fundraising": "Fonlama",
        "sourceKind.aggregator": "Toplayıcı",
        "ledger.scan": "Tarama çalıştır",
        "ledger.fundAll": "Fonlama: tümü",
        "ledger.open": "Fonlama açık",
        "ledger.buildProfile": "Eşleşme profili oluştur",
        "ledger.scanning": "Taranıyor…",
        "match.send": "Gönder",
        "match.rematch": "Fikirleri yeniden eşleştir",
        "match.scoring": "Puanlanıyor…",
        "match.viewLedger": "Defteri görüntüle",
        "match.loading": "Eşleştirici yükleniyor…",
        "ideaChat.sources": "Veri kaynakları",
        "ideaMedia.kicker": "Kaynak medyası",
        "today.openMatch": "Eşleşme sohbetini aç",
        "today.dossier": "Tam dosyayı aç",
        "today.updateProfile": "Profili güncelle",
        "today.collection": "Koleksiyonu görüntüle",
        "auth.registerKicker": "Hesap oluştur",
        "auth.register": "Hesap oluştur",
        "method.scanLabel": "Tara",
        "method.dailyLabel": "Günlük seçim",
        "sources.kicker": "Alım masası",
        "sources.title": "Veri kaynakları",
        "sources.health.degraded": "Bozulmuş",
        "sources.health.stale": "Eski",
        "sources.health.offline": "Çevrimdışı",
        "teaser.open": "Bugünün seçimini aç",
        "dossier.location": "(iii) Ekip konumu",
        "dossier.sector": "(vi) Sektör",
        "ledger.sortMatch": "Sırala: eşleşme puanı",
        "ledger.sortRecent": "Sırala: son tarama",
        "today.dateLabel": "Bugünün önerisi · {day}",
    },
    "pt-BR": {
        "nav.match": "Combinar",
        "common.people": "{count} pessoas",
        "hero.browse": "Ver {count} ideias",
        "time.minutesAgo": "há {count} min",
        "time.hoursAgo": "há {count} h",
        "time.daysAgo": "há {count} d",
    },
    "vi": {
        "auth.email": "Địa chỉ email",
        "common.people": "{count} người",
        "sources.shown": "Hiển thị {count}",
        "hero.browse": "Duyệt {count} ý tưởng",
        "teaser.ready": "Kết hợp tốt nhất hôm nay: {title}",
        "ledger.shown": "Hiển thị {count}",
        "ledger.match": "Khớp {score}%",
        "ideaChat.title": "Hỏi về {name}",
        "ideaChat.welcome": "Tôi là trợ lý hồ sơ cho {name}. Hỏi về tài trợ, đội ngũ, mô hình kinh doanh, bước tiếp theo hoặc nguồn dữ liệu — tôi sẽ trích dẫn nguồn trong mỗi câu trả lời.",
        "ideaChat.placeholder": "Hỏi về {name}…",
        "today.dateLabel": "Đề xuất hôm nay · {day}",
    },
    "nl": {
        "sources.shown": "{count} weergegeven",
        "today.kicker": "Aanbeveling van vandaag",
        "match.send": "Versturen",
    },
}


def protect(text: str) -> tuple[str, dict[str, str]]:
    tokens: dict[str, str] = {}
    for i, ph in enumerate(PLACEHOLDERS):
        token = f"ZZPH{i}ZZ"
        text = text.replace("{" + ph + "}", token)
        tokens[token] = "{" + ph + "}"
    for term, token in PROTECT_TERMS:
        if term in text:
            text = text.replace(term, token)
            tokens[token] = term
    return text, tokens


def restore(text: str, tokens: dict[str, str]) -> str:
    for token, original in tokens.items():
        text = text.replace(token, original)
    return text


def translate_line(text: str, from_code: str, to_code: str) -> str:
    protected, tokens = protect(text)
    translated = argostranslate.translate.translate(protected, from_code, to_code)
    return restore(translated, tokens)


def translate_safe(text: str, from_code: str, to_code: str, max_len: int = 100) -> str:
    if not text.strip():
        return text
    if len(text) <= max_len:
        return translate_line(text, from_code, to_code)
    parts = re.split(r"(?<=[.!?;])\s+", text)
    if len(parts) == 1:
        parts = []
        step = 90
        for i in range(0, len(text), step):
            parts.append(text[i : i + step])
    return " ".join(translate_line(p.strip(), from_code, to_code) for p in parts if p.strip())


def post_fix(locale: str, key: str, value: str) -> str:
    if "skip" in key or key.startswith("match."):
        value = re.sub(r"(?i)\bskip\b", "skip", value)
    return fix_placeholders(value)


def fix_placeholders(text: str) -> str:
    for i, ph in enumerate(PLACEHOLDERS):
        text = re.sub(rf"Z{{1,3}}PH{i}Z{{0,3}}", "{" + ph + "}", text, flags=re.IGNORECASE)
        text = re.sub(rf"\bPH{i}\b", "{" + ph + "}", text, flags=re.IGNORECASE)
    for token, original in [
        ("ZZVSZZ", "VentureScan"),
        ("ZZSQLITEZZ", "SQLite"),
        ("ZZARROWZZ", "→"),
        ("ZZB2BZZ", "B2B"),
        ("ZZAPIZZ", "API"),
        ("ZZPYTHONZZ", "Python"),
        ("ZZSKIPZZ", "skip"),
    ]:
        text = text.replace(token, original)
    return text


def ensure_packages() -> None:
    argostranslate.package.update_package_index()
    installed = {p.to_code for p in argostranslate.package.get_installed_packages() if p.from_code == "en"}
    available = argostranslate.package.get_available_packages()
    for code in ("pt", "it", "nl", "ar", "vi", "th", "tr"):
        if code in installed:
            continue
        pkg = next(p for p in available if p.from_code == "en" and p.to_code == code)
        argostranslate.package.install_from_path(pkg.download())
        installed.add(code)
    if "pt" not in {p.to_code for p in argostranslate.package.get_installed_packages() if p.from_code == "es"}:
        pkg = next(p for p in available if p.from_code == "es" and p.to_code == "pt")
        argostranslate.package.install_from_path(pkg.download())


def build_from_source(
    locale: str,
    source: dict[str, str],
    from_code: str,
    to_code: str,
) -> dict[str, str]:
    en = json.loads((PACKS / "en.json").read_text())
    pack: dict[str, str] = {}
    manual = {**TIME_BY_LOCALE.get(locale, {}), **MANUAL.get(locale, {})}
    for key in en:
        if key in manual:
            pack[key] = manual[key]
            continue
        english = source[key]
        pack[key] = post_fix(locale, key, translate_safe(english, from_code, to_code))
    return pack


def main() -> None:
    ensure_packages()
    en = json.loads((PACKS / "en.json").read_text())
    es = json.loads((PACKS / "es.json").read_text())

    jobs = [
        ("pt-BR", es, "es", "pt"),
        ("it", en, "en", "it"),
        ("nl", en, "en", "nl"),
        ("ar", en, "en", "ar"),
        ("vi", en, "en", "vi"),
        ("th", en, "en", "th"),
        ("tr", en, "en", "tr"),
    ]

    for locale, source, from_code, to_code in jobs:
        pack = build_from_source(locale, source, from_code, to_code)
        ordered = {k: pack[k] for k in en}
        (PACKS / f"{locale}.json").write_text(
            json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        miss = [k for k in en if k not in ordered]
        same = [k for k in en if ordered[k] == en[k]]
        bad = [k for k, v in ordered.items() if len(v) > 400]
        print(f"{locale}: miss={len(miss)} same={len(same)} long={len(bad)}")

    # User verification table
    print("---")
    for c in ["pt-BR", "it", "nl", "ar", "vi", "th", "tr"]:
        p = json.loads((PACKS / f"{c}.json").read_text())
        miss = [k for k in en if k not in p]
        same = [k for k in en if p.get(k) == en[k]]
        print(c, "miss", len(miss), "same", len(same))


if __name__ == "__main__":
    main()
