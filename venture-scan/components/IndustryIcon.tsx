import type { IndustryIconId } from "@/lib/industry-icons";
import { industryIconId } from "@/lib/industry-icons";

type Props = {
  industry?: string;
  id?: IndustryIconId;
  className?: string;
  title?: string;
};

/** Compact monoline glyph for industry filters and labels. */
export function IndustryIcon({ industry = "", id, className, title }: Props) {
  const icon = id ?? industryIconId(industry);
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

function IconPath({ id }: { id: IndustryIconId }) {
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
    case "agritech":
      return (
        <>
          <path d="M12 20V10" />
          <path d="M12 10c-3 0-5-2.5-5-5 3 0 5 2.5 5 5Z" />
          <path d="M12 12c3-.5 5.5-2.5 6-5.5-3.5.5-5.5 2.5-6 5.5Z" />
        </>
      );
    case "climate":
      return (
        <>
          <path d="M12 4v2M12 18v2M4.9 6.9l1.4 1.4M17.7 15.7l1.4 1.4M4 12h2M18 12h2M4.9 17.1l1.4-1.4M17.7 8.3l1.4-1.4" />
          <circle cx="12" cy="12" r="3.5" />
        </>
      );
    case "cyber":
      return (
        <>
          <path d="M12 3 5 6v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" />
          <path d="M9.5 12.2 11.2 14l3.3-3.5" />
        </>
      );
    case "devtools":
      return (
        <>
          <path d="M8 8 4.5 12 8 16" />
          <path d="M16 8 19.5 12 16 16" />
          <path d="M13.2 6.5 10.8 17.5" />
        </>
      );
    case "ecommerce":
      return (
        <>
          <path d="M5 7h2l1.2 9h9.3l1.5-6.5H8.2" />
          <circle cx="10" cy="19" r="1.2" />
          <circle cx="16.5" cy="19" r="1.2" />
        </>
      );
    case "edtech":
      return (
        <>
          <path d="M3.5 10 12 6l8.5 4L12 14 3.5 10Z" />
          <path d="M7.5 12v4.2c1.5 1.2 3.2 1.8 4.5 1.8s3-.6 4.5-1.8V12" />
          <path d="M19.5 10.5V16" />
        </>
      );
    case "energy":
      return <path d="M13 3 6.5 13.5H12l-1 7.5L18.5 10H13l0-7Z" />;
    case "enterprise":
      return (
        <>
          <path d="M5 20V7l7-3 7 3v13" />
          <path d="M9 20v-5h6v5" />
          <path d="M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" />
        </>
      );
    case "fintech":
      return (
        <>
          <rect x="4" y="7" width="16" height="11" rx="2" />
          <path d="M4 11h16" />
          <path d="M8 15h3" />
        </>
      );
    case "food":
      return (
        <>
          <path d="M8 4v7a2 2 0 0 0 2 2v7" />
          <path d="M8 4c0 2.5-1.5 4-1.5 4M8 4c0 2.5 1.5 4 1.5 4" />
          <path d="M15 4v16M15 4c2.2 1.2 3.5 3.2 3.5 6.5S17.2 15 15 15" />
        </>
      );
    case "hr":
      return (
        <>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="16" cy="10" r="2" />
          <path d="M4.5 18c.6-2.4 2.4-3.7 4.5-3.7s3.9 1.3 4.5 3.7" />
          <path d="M13.2 18c.4-1.7 1.6-2.7 3-2.7 1.2 0 2.2.7 2.8 2" />
        </>
      );
    case "health":
      return (
        <>
          <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
          <path d="M12 9.5v5M9.5 12h5" />
        </>
      );
    case "legal":
      return (
        <>
          <path d="M12 4v15" />
          <path d="M7 8h10" />
          <path d="M7 8 4.5 13.5h5L7 8Z" />
          <path d="M17 8 14.5 13.5h5L17 8Z" />
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
    case "martech":
      return (
        <>
          <path d="M5 18 9.5 8l3 5 2-3.5L19 18" />
          <path d="M4 18h16" />
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
          <path d="M5 15.5 6.5 9.5h11L19 15.5" />
          <path d="M4 15.5h16" />
          <circle cx="8" cy="16.5" r="1.5" />
          <circle cx="16" cy="16.5" r="1.5" />
          <path d="M8.5 9.5 9.5 6.5h5l1 3" />
        </>
      );
    case "productivity":
      return (
        <>
          <path d="M9 6h11v13H9z" />
          <path d="M9 6 5.5 8.5V19" />
          <path d="M12 10h5M12 13h5M12 16h3.5" />
        </>
      );
    case "saas":
      return (
        <>
          <path d="M8 15a4 4 0 1 1 1.2-7.8A5 5 0 0 1 19 10a3.2 3.2 0 0 1-.2 5.8H8.4" />
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
