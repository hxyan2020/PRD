type Props = {
  platform: string;
  className?: string;
};

function normalizePlatform(platform: string): string {
  const p = platform.trim().toLowerCase();
  if (p.startsWith("amazon")) return "amazon";
  if (p.includes("walmart")) return "walmart";
  if (p.includes("target")) return "target";
  if (p.includes("etsy")) return "etsy";
  if (p.includes("aliexpress") || p.includes("ali express")) return "aliexpress";
  if (p.includes("yellow mountain")) return "ymi";
  return "generic";
}

/** Compact brand mark shown in front of ecommerce platform names. */
export function PlatformLogo({ platform, className = "" }: Props) {
  const key = normalizePlatform(platform);
  const label = `${platform} logo`;

  return (
    <span
      className={`platform-logo platform-logo-${key} ${className}`.trim()}
      aria-hidden="true"
      title={label}
    >
      {key === "amazon" ? (
        <svg viewBox="0 0 24 24" role="img">
          <rect x="1" y="1" width="22" height="22" rx="5" fill="#232F3E" />
          <path
            fill="#fff"
            d="M10.1 8.1c-.9 0-1.5.3-2 .8l.85.85c.35-.4.8-.65 1.35-.65.7 0 1.15.4 1.15 1.05v.15c-1.55.05-3.45.4-3.45 2.15 0 1.15.9 1.9 2.15 1.9.85 0 1.5-.35 1.95-.85v.7h1.15V9.95c0-1.2-.9-1.85-2.15-1.85zm.55 3.85v.3c0 .75-.55 1.3-1.4 1.3-.65 0-1.05-.35-1.05-.85 0-.9 1.15-1.1 2.45-1.1v.35z"
          />
          <path
            fill="#FF9900"
            d="M5.8 16.35c1.55.85 3.85 1.35 5.95 1.35 1.85 0 3.85-.4 5.2-1.1.35-.2.55.15.3.4-1.55 1.4-4.05 2.15-6.35 2.15-2.55 0-5.05-.85-6.7-2.1-.3-.2 0-.6.4-.4.4.2.8.4 1.2.7z"
          />
          <path
            fill="#FF9900"
            d="M17.7 15.55c.2-.2.05-.55-.25-.4-.55.2-.7.25-1.05.1-.1 0-.15-.1-.1-.15.35-.3 1.65-.3 1.8-.05.1.15.1.9 0 1.25 0 .15-.1.2-.15.15-.15-.15-.35-.4-.25-.9z"
          />
        </svg>
      ) : null}

      {key === "walmart" ? (
        <svg viewBox="0 0 24 24" role="img">
          <circle cx="12" cy="12" r="11" fill="#0071CE" />
          <g fill="#FFC220">
            <path d="M12 4.2l1.1 3.8H17l-3.2 2.3 1.2 3.8L12 11.8 8.9 14.1l1.2-3.8L6.9 8h3.9z" />
          </g>
        </svg>
      ) : null}

      {key === "target" ? (
        <svg viewBox="0 0 24 24" role="img">
          <circle cx="12" cy="12" r="11" fill="#CC0000" />
          <circle cx="12" cy="12" r="7.2" fill="#fff" />
          <circle cx="12" cy="12" r="3.6" fill="#CC0000" />
        </svg>
      ) : null}

      {key === "etsy" ? (
        <svg viewBox="0 0 24 24" role="img">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#F1641E" />
          <path
            fill="#fff"
            d="M8.2 7.2h7.1v1.7H10v2.1h4.6v1.6H10v2.5h5.5v1.7H8.2z"
          />
        </svg>
      ) : null}

      {key === "aliexpress" ? (
        <svg viewBox="0 0 24 24" role="img">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#E62E04" />
          <path
            fill="#fff"
            d="M6.2 14.8c1.6 1.4 3.6 2.2 5.8 2.2s4.2-.8 5.8-2.2l-1.2-1.2c-1.2 1.1-2.8 1.7-4.6 1.7s-3.4-.6-4.6-1.7zm1.5-3.1l1.4-1.4c.8.8 1.9 1.3 3.1 1.3s2.3-.5 3.1-1.3l1.4 1.4c-1.2 1.1-2.8 1.8-4.5 1.8s-3.3-.7-4.5-1.8zM12 6.2l2.2 2.2L12 10.6 9.8 8.4z"
          />
        </svg>
      ) : null}

      {key === "ymi" ? (
        <svg viewBox="0 0 24 24" role="img">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#2F5D50" />
          <path fill="#E8C547" d="M4.5 16.5 9 9.5l3 4 2.2-2.8 5.3 5.8z" />
          <path fill="#8FBFB0" d="M4.5 16.5h15v2.2h-15z" />
        </svg>
      ) : null}

      {key === "generic" ? (
        <svg viewBox="0 0 24 24" role="img">
          <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#C9A227" />
          <path
            fill="#0C2428"
            d="M7 8.2h10v1.6H8.7v1.8H16v1.5H8.7v2.2H17V17H7z"
          />
        </svg>
      ) : null}
    </span>
  );
}
