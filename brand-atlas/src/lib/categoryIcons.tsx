import type { ReactNode } from "react";

type IconProps = { className?: string };

function Icon({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Compact line icons for category shelf chips. */
export const CATEGORY_ICONS: Record<string, (props?: IconProps) => ReactNode> = {
  cars: (p) => (
    <Icon {...p}>
      <path d="M4 14.5h16" />
      <path d="M5.2 14.5 6.5 10a1.8 1.8 0 0 1 1.7-1.2h7.6A1.8 1.8 0 0 1 17.5 10l1.3 4.5" />
      <circle cx="7.2" cy="16.4" r="1.35" />
      <circle cx="16.8" cy="16.4" r="1.35" />
    </Icon>
  ),
  cigarettes: (p) => (
    <Icon {...p}>
      <path d="M3.5 14.8h11" />
      <path d="M14.5 14.8h2.4" />
      <path d="M16.9 14.8H20.5" />
      <path d="M16.9 12.4h2.2" />
      <path d="M18.2 9.4c.55-.9.55-2 0-2.9" />
      <path d="M5.5 14.8V16.4M8.8 14.8V16.4M12.1 14.8V16.4" />
    </Icon>
  ),
  alcohol: (p) => (
    <Icon {...p}>
      <path d="M9.2 3.8h5.6" />
      <path d="M10.4 3.8V7L7.6 12.5v6.2A1.5 1.5 0 0 0 9.1 20h5.8a1.5 1.5 0 0 0 1.5-1.3v-6.2L13.6 7V3.8" />
      <path d="M8.2 12.8h7.6" />
    </Icon>
  ),
  hotdrinks: (p) => (
    <Icon {...p}>
      <path d="M5.8 9.4h9.4v7A2.3 2.3 0 0 1 12.9 18.7H8.1A2.3 2.3 0 0 1 5.8 16.4V9.4Z" />
      <path d="M15.2 10.8h1.7a2.3 2.3 0 1 1 0 4.6h-1.7" />
      <path d="M8.2 5.8c.45.65.45 1.35 0 2" />
      <path d="M11 5.8c.45.65.45 1.35 0 2" />
    </Icon>
  ),
  coffee: (p) => (
    <Icon {...p}>
      <path d="M5.8 9.4h9.4v7A2.3 2.3 0 0 1 12.9 18.7H8.1A2.3 2.3 0 0 1 5.8 16.4V9.4Z" />
      <path d="M15.2 10.8h1.7a2.3 2.3 0 1 1 0 4.6h-1.7" />
      <path d="M8.2 5.8c.45.65.45 1.35 0 2" />
      <path d="M11 5.8c.45.65.45 1.35 0 2" />
    </Icon>
  ),
  tea: (p) => (
    <Icon {...p}>
      <path d="M5.6 10.4h10v6.2A2.5 2.5 0 0 1 13.1 19H8A2.5 2.5 0 0 1 5.6 16.6v-6.2Z" />
      <path d="M15.6 11.8h1.5a2.2 2.2 0 1 1 0 4.4h-1.5" />
      <path d="M10.6 5.4c1.35.95 1.35 2.3 0 3.25" />
    </Icon>
  ),
  clothes: (p) => (
    <Icon {...p}>
      <path d="M9.1 5.4 12 7.5l2.9-2.1 3.2 2.1-2.1 2.3V19H8V9.7L5.9 7.5 9.1 5.4Z" />
    </Icon>
  ),
  luxury: (p) => (
    <Icon {...p}>
      <path d="M7.2 8.8h9.6l1.7 3.1L12 19.2 5.5 11.9l1.7-3.1Z" />
      <path d="M7.2 8.8 10 12h4l2.8-3.2" />
      <path d="M10 12 12 8.8 14 12" />
    </Icon>
  ),
  trees: (p) => (
    <Icon {...p}>
      <path d="M12 20.2v-5" />
      <path d="M12 6.2 7.4 13h9.2L12 6.2Z" />
      <path d="M12 9.4 8.6 15h6.8L12 9.4Z" />
    </Icon>
  ),
  flowers: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="9.2" r="1.7" />
      <path d="M12 7.5V4.8M12 10.9v2.2M9.8 8.2 7.8 6.6M14.2 8.2l2 1.6M9.8 10.2l-2 1.6M14.2 10.2l2-1.6" />
      <path d="M12 13.1V20" />
      <path d="M10.2 17.2c1.2-1 2.4-1 3.6 0" />
    </Icon>
  ),
  animals: (p) => (
    <Icon {...p}>
      <path d="M8.4 10.8c0-2.1 1.6-3.8 3.6-3.8s3.6 1.7 3.6 3.8c0 3-1.4 4.9-3.6 6.4-2.2-1.5-3.6-3.4-3.6-6.4Z" />
      <path d="M6.2 9.2l.8 1.7M17.8 9.2l-.8 1.7" />
      <path d="M10.4 11.2h.25M13.35 11.2h.25" />
      <path d="M10.6 13.3c.7.55 1.9.55 2.8 0" />
    </Icon>
  ),
  food: (p) => (
    <Icon {...p}>
      <path d="M7.2 4.8v6a2.3 2.3 0 0 0 2.3 2.3V19" />
      <path d="M7.2 7.4h2.3" />
      <path d="M14.4 4.8c1.7 0 3.1 1.4 3.1 3.2S16.1 11.2 14.4 11.2V19" />
    </Icon>
  ),
  softdrinks: (p) => (
    <Icon {...p}>
      <path d="M9 4h6l1.5 4.5v9.2A2.3 2.3 0 0 1 14.2 20H9.8A2.3 2.3 0 0 1 7.5 17.7V8.5L9 4Z" />
      <path d="M9.2 10.5h5.6" />
    </Icon>
  ),
  snacks: (p) => (
    <Icon {...p}>
      <path d="M7 8.5c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5v9H7v-9Z" />
      <path d="M7 11.5h10" />
    </Icon>
  ),
  dairy: (p) => (
    <Icon {...p}>
      <path d="M9 5h6l1 3v10.5A1.5 1.5 0 0 1 14.5 20h-5A1.5 1.5 0 0 1 8 18.5V8l1-3Z" />
      <path d="M9.5 10h5" />
    </Icon>
  ),
  beauty: (p) => (
    <Icon {...p}>
      <path d="M12 4.5v4" />
      <path d="M9.5 8.5h5l1.2 10.2A1.3 1.3 0 0 1 14.4 20H9.6a1.3 1.3 0 0 1-1.3-1.3L9.5 8.5Z" />
    </Icon>
  ),
  tech: (p) => (
    <Icon {...p}>
      <rect x="6" y="4.5" width="12" height="15" rx="2" />
      <path d="M10 17.5h4" />
    </Icon>
  ),
  sportswear: (p) => (
    <Icon {...p}>
      <path d="M8.5 7.5 12 9.5l3.5-2 2.5 2-1.8 2.2V19h-9V9.7L6 9.5l2.5-2Z" />
    </Icon>
  ),
  pharma: (p) => (
    <Icon {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </Icon>
  ),
  watches: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 9.5v3l2 1.2" />
      <path d="M10 4.5h4M10 19.5h4" />
    </Icon>
  ),
  airlines: (p) => (
    <Icon {...p}>
      <path d="M4 13.5h16" />
      <path d="M6.5 13.5 11 7.5h2l1.5 6" />
      <path d="M14.5 13.5 18 10.5" />
      <path d="M9 13.5v4M13.5 13.5v4" />
    </Icon>
  ),
  banks: (p) => (
    <Icon {...p}>
      <path d="M4.5 9.5 12 5l7.5 4.5H4.5Z" />
      <path d="M6 10.5v7M10 10.5v7M14 10.5v7M18 10.5v7" />
      <path d="M4.5 18.5h15" />
    </Icon>
  ),
  instruments: (p) => (
    <Icon {...p}>
      <path d="M9 5v11.5a2.5 2.5 0 1 0 2-2.45V8.5l7-1.5v8a2.5 2.5 0 1 0 2-2.45V5.5L11 7.2V5H9Z" />
    </Icon>
  ),
  toys: (p) => (
    <Icon {...p}>
      <rect x="5.5" y="8" width="13" height="10" rx="2" />
      <circle cx="9" cy="13" r="1.2" />
      <circle cx="15" cy="13" r="1.2" />
      <path d="M9.5 5.5h5v2.5h-5z" />
    </Icon>
  ),
  motorcycles: (p) => (
    <Icon {...p}>
      <circle cx="7.5" cy="16" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
      <path d="M9.5 15.5 12 9h3l2.5 6.5" />
      <path d="M12 9 9 12.5H6.5" />
    </Icon>
  ),
  birds: (p) => (
    <Icon {...p}>
      <path d="M5 14c3-6 8-9 13-8 1.5 2 1.5 5 0 7-4 3-9 3-13 1Z" />
      <path d="M15 8.5 18 5" />
    </Icon>
  ),
  mushrooms: (p) => (
    <Icon {...p}>
      <path d="M6 12c0-4.5 2.7-8 6-8s6 3.5 6 8c-1.5-1.5-3.8-2.2-6-2.2S7.5 10.5 6 12Z" />
      <path d="M11 12v7h2v-7" />
    </Icon>
  ),
};

export function categoryIcon(categoryId: string, className?: string): ReactNode {
  const render = CATEGORY_ICONS[categoryId] ?? CATEGORY_ICONS.food;
  return render({ className });
}
