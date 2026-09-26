"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { placeLabel } from "@/lib/i18n/lookups";
import { flagCode, flagSrc } from "@/lib/flags";

export function CountryLabel({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const src = flagSrc(name);
  const code = flagCode(name);
  const label = placeLabel(name, locale);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={16}
          height={12}
          data-flag={code ?? undefined}
          className="inline-block h-3 w-4 shrink-0 rounded-[1px] object-cover ring-1 ring-black/40"
        />
      ) : null}
      <span>{label}</span>
    </span>
  );
}

export function CountryLabelList({
  names,
  className = "",
}: {
  names: string[];
  className?: string;
}) {
  if (!names.length) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`.trim()}>
      {names.map((name) => (
        <CountryLabel key={name} name={name} />
      ))}
    </span>
  );
}
