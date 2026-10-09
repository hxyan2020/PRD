/** ISO 3166-1 alpha-2 national / regional flags via flagcdn (reliable where emoji flags fail). */

type FlagProps = {
  /** ISO 3166-1 alpha-2 country code, e.g. "us", "cn", "tw" */
  code: string;
  title?: string;
  className?: string;
  size?: "sm" | "md";
};

const SIZE = {
  sm: { w: 18, h: 13, className: "h-[13px] w-[18px]" },
  md: { w: 22, h: 16, className: "h-4 w-[22px]" },
} as const;

export function Flag({ code, title, className, size = "md" }: FlagProps) {
  const cc = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[2px] bg-white/10 text-[9px] text-mist ${SIZE[size].className} ${className ?? ""}`}
        title={title}
        aria-hidden
      >
        🌐
      </span>
    );
  }
  const dims = SIZE[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static flag assets from CDN
    <img
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      width={dims.w}
      height={dims.h}
      alt=""
      title={title}
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${dims.className} ${className ?? ""}`}
    />
  );
}
