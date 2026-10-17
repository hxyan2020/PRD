import type { SectorIconId } from "@/lib/sector-icons";
import { sectorIconId } from "@/lib/sector-icons";

type Props = {
  sector?: string;
  id?: SectorIconId;
  className?: string;
  title?: string;
};

/** Compact monoline glyph for sector filters. */
export function SectorIcon({ sector = "", id, className, title }: Props) {
  const icon = id ?? sectorIconId(sector);
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <IconPath id={icon} />
    </svg>
  );
}

function IconPath({ id }: { id: SectorIconId }) {
  switch (id) {
    case "all":
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8M12 8v8" />
        </>
      );
    case "ai":
      return (
        <>
          <rect x="7" y="8" width="10" height="9" rx="2" />
          <path d="M9.5 8V6.5M14.5 8V6.5M10 12h.01M14 12h.01M10.5 15h3" />
        </>
      );
    case "automation":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.5M12 18v2.5M3.5 12h2.5M18 12h2.5M6.2 6.2l1.8 1.8M16 16l1.8 1.8M17.8 6.2 16 8M8 16l-1.8 1.8" />
        </>
      );
    case "banking":
      return (
        <>
          <path d="M4 10 12 5l8 5" />
          <path d="M6 10v7M10 10v7M14 10v7M18 10v7" />
          <path d="M4 17h16" />
        </>
      );
    case "battery":
      return (
        <>
          <rect x="5" y="8" width="12" height="8" rx="1.5" />
          <path d="M17 10.5v3M9 11v2M12 11v2" />
        </>
      );
    case "climate":
      return (
        <>
          <path d="M12 4v2M12 18v2M4.9 6.9l1.4 1.4M17.7 15.7l1.4 1.4M4 12h2M18 12h2" />
          <circle cx="12" cy="12" r="3.5" />
        </>
      );
    case "code":
      return (
        <>
          <path d="M8 8 4.5 12 8 16" />
          <path d="M16 8 19.5 12 16 16" />
          <path d="M13.2 6.5 10.8 17.5" />
        </>
      );
    case "collab":
      return (
        <>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="16" cy="10" r="2" />
          <path d="M4.5 18c.6-2.4 2.4-3.7 4.5-3.7s3.9 1.3 4.5 3.7" />
          <path d="M13.2 18c.4-1.7 1.6-2.7 3-2.7 1.2 0 2.2.7 2.8 2" />
        </>
      );
    case "commerce":
      return (
        <>
          <path d="M5 7h2l1.2 9h9.3l1.5-6.5H8.2" />
          <circle cx="10" cy="19" r="1.2" />
          <circle cx="16.5" cy="19" r="1.2" />
        </>
      );
    case "creative":
      return (
        <>
          <path d="M8 16.5 15.5 4.5l3 3L11 19.5H8v-3Z" />
          <path d="M13.8 6.8l3 3" />
        </>
      );
    case "data":
      return (
        <>
          <ellipse cx="12" cy="7" rx="6" ry="2.5" />
          <path d="M6 7v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" />
          <path d="M6 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
        </>
      );
    case "delivery":
      return (
        <>
          <path d="M4 16V9h8v7" />
          <path d="M12 11h4l2.5 3v2H12" />
          <circle cx="7" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </>
      );
    case "design":
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4v5M12 15v5" />
        </>
      );
    case "education":
      return (
        <>
          <path d="M3.5 10 12 6l8.5 4L12 14 3.5 10Z" />
          <path d="M7.5 12v4.2c1.5 1.2 3.2 1.8 4.5 1.8s3-.6 4.5-1.8V12" />
        </>
      );
    case "energy":
      return <path d="M13 3 6.5 13.5H12l-1 7.5L18.5 10H13l0-7Z" />;
    case "events":
      return (
        <>
          <rect x="5" y="6" width="14" height="13" rx="2" />
          <path d="M5 10h14M9 4v4M15 4v4" />
        </>
      );
    case "finance":
      return (
        <>
          <rect x="4" y="7" width="16" height="11" rx="2" />
          <path d="M4 11h16M8 15h3" />
        </>
      );
    case "food":
      return (
        <>
          <path d="M8 4v7a2 2 0 0 0 2 2v7" />
          <path d="M15 4v16M15 4c2.2 1.2 3.5 3.2 3.5 6.5S17.2 15 15 15" />
        </>
      );
    case "health":
      return (
        <>
          <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
          <path d="M12 9.5v5M9.5 12h5" />
        </>
      );
    case "hr":
      return (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 19c1-3.2 3.5-5 6.5-5s5.5 1.8 6.5 5" />
        </>
      );
    case "infra":
      return (
        <>
          <path d="M8 15a4 4 0 1 1 1.2-7.8A5 5 0 0 1 19 10a3.2 3.2 0 0 1-.2 5.8H8.4" />
        </>
      );
    case "insurance":
      return (
        <>
          <path d="M12 3 5 6v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" />
          <path d="M12 9v4M12 15.5h.01" />
        </>
      );
    case "legal":
      return (
        <>
          <path d="M12 4v15M7 8h10" />
          <path d="M7 8 4.5 13.5h5L7 8ZM17 8l-2.5 5.5h5L17 8Z" />
          <path d="M9 19h6" />
        </>
      );
    case "logistics":
      return (
        <>
          <path d="M3 16V8h10v8" />
          <path d="M13 11h4l3 3v2h-7" />
          <circle cx="7" cy="17.5" r="1.5" />
          <circle cx="17" cy="17.5" r="1.5" />
        </>
      );
    case "manufacturing":
      return (
        <>
          <path d="M4 19V9l5 3V9l5 3V6l6 3v10" />
          <path d="M4 19h16" />
        </>
      );
    case "marketplace":
      return (
        <>
          <path d="M4 9h16v10H4z" />
          <path d="M4 9 6.5 5h11L20 9" />
          <path d="M10 13h4" />
        </>
      );
    case "media":
      return (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M10 9.5v5l4.5-2.5L10 9.5Z" />
        </>
      );
    case "mobility":
      return (
        <>
          <path d="M5 15.5 6.5 9.5h11L19 15.5M4 15.5h16" />
          <circle cx="8" cy="16.5" r="1.5" />
          <circle cx="16" cy="16.5" r="1.5" />
        </>
      );
    case "payments":
      return (
        <>
          <rect x="4" y="7" width="16" height="11" rx="2" />
          <path d="M4 11h16" />
          <path d="M8 15h4" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="5.5" />
          <path d="M15.5 15.5 20 20" />
        </>
      );
    case "security":
      return (
        <>
          <path d="M12 3 5 6v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" />
          <path d="M9.5 12.2 11.2 14l3.3-3.5" />
        </>
      );
    case "support":
      return (
        <>
          <path d="M6 12a6 6 0 0 1 12 0v3a2 2 0 0 1-2 2h-1" />
          <path d="M6 12v3a2 2 0 0 0 2 2h1" />
          <path d="M12 19v1.5" />
        </>
      );
    case "video":
      return (
        <>
          <rect x="4" y="7" width="11" height="10" rx="2" />
          <path d="M15 10.5 20 8v8l-5-2.5" />
        </>
      );
    case "voice":
      return (
        <>
          <rect x="9" y="4" width="6" height="10" rx="3" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
        </>
      );
    case "work":
      return (
        <>
          <path d="M9 6h11v13H9z" />
          <path d="M9 6 5.5 8.5V19" />
          <path d="M12 10h5M12 13h5M12 16h3.5" />
        </>
      );
    default:
      return (
        <>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <path d="M9 12h6" />
        </>
      );
  }
}
