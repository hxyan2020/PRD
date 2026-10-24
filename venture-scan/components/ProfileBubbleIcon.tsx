import type { ProfileBubble } from "@/lib/profile-options";

/** Compact line icons for profile suggestion bubbles. */
export function ProfileBubbleIcon({
  icon,
  className = "h-4 w-4",
}: {
  icon: ProfileBubble["icon"];
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "finance":
      return (
        <svg {...common}>
          <path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h8" />
        </svg>
      );
    case "product":
      return (
        <svg {...common}>
          <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
          <path d="M12 12v8M4 8l8 4 8-4" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 6l-4 12" />
        </svg>
      );
    case "design":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </svg>
      );
    case "sales":
      return (
        <svg {...common}>
          <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        </svg>
      );
    case "ops":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </svg>
      );
    case "data":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
    case "legal":
      return (
        <svg {...common}>
          <path d="M12 3v18M5 8h14M7 8l-3 7h6L7 8zm10 0 3 7h-6l3-7z" />
        </svg>
      );
    case "edu":
      return (
        <svg {...common}>
          <path d="M3 9l9-5 9 5-9 5-9-5z" />
          <path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
        </svg>
      );
    case "health":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
        </svg>
      );
    case "climate":
      return (
        <svg {...common}>
          <path d="M12 3v10M9 7h6" />
          <path d="M7 14a5 5 0 0 0 10 0" />
        </svg>
      );
    case "games":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="10" rx="3" />
          <path d="M8 13h2M9 12v2M15 12.5h.01M17.5 13.5h.01" />
        </svg>
      );
    case "travel":
      return (
        <svg {...common}>
          <path d="M10 20l2-8 8-2-12-4-4 12 4-2z" />
        </svg>
      );
    case "lifestyle":
      return (
        <svg {...common}>
          <path d="M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.8L12 3z" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <rect x="5" y="7" width="14" height="12" rx="3" />
          <path d="M9 7V5M15 7V5M9 12h.01M15 12h.01M10 16h4" />
        </svg>
      );
    case "commerce":
      return (
        <svg {...common}>
          <path d="M4 6h2l2.2 10h9.6L20 8H8" />
          <circle cx="10" cy="20" r="1.2" />
          <circle cx="17" cy="20" r="1.2" />
        </svg>
      );
    case "business":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="1.5" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "major":
      return (
        <svg {...common}>
          <path d="M4 19V7l8-3 8 3v12" />
          <path d="M9 19v-6h6v6" />
        </svg>
      );
    case "market-us":
    case "market-asia":
    case "market-eu":
    case "market-latam":
    case "market-me":
    case "market-africa":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
