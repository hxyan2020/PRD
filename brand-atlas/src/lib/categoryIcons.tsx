/** Compact SVG marks for category pills / chips. */

import type { ReactNode } from "react";

type IconProps = { className?: string };

function Glyph({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, (p: IconProps) => ReactNode> = {
  cars: (p) => (
    <Glyph {...p}>
      <path d="M3 13h18l-1.5-5.5A2 2 0 0 0 17.6 6H6.4a2 2 0 0 0-1.9 1.5L3 13Z" />
      <path d="M5 13v3h2.5M16.5 16H19v-3" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </Glyph>
  ),
  motorcycles: (p) => (
    <Glyph {...p}>
      <circle cx="6.5" cy="16.5" r="3" />
      <circle cx="17.5" cy="16.5" r="3" />
      <path d="M9.5 16.5h3l2-5h3.5M12.5 11.5 9 7H6" />
    </Glyph>
  ),
  cigarettes: (p) => (
    <Glyph {...p}>
      <path d="M4 14h12v4H4zM16 14h4v4h-4zM8 10v-1a2 2 0 0 1 2-2h0a2 2 0 0 0 2-2V4" />
    </Glyph>
  ),
  alcohol: (p) => (
    <Glyph {...p}>
      <path d="M8 3h8l-1 5H9L8 3ZM9 8h6v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8Z" />
    </Glyph>
  ),
  liquor: (p) => (
    <Glyph {...p}>
      <path d="M9 3h6v3l2 4v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l2-4V3Z" />
      <path d="M9 10h6" />
    </Glyph>
  ),
  wine: (p) => (
    <Glyph {...p}>
      <path d="M8 3h8l-1.5 8a4.5 4.5 0 0 1-9 0L8 3Z" />
      <path d="M12 15v6M9 21h6" />
    </Glyph>
  ),
  sake: (p) => (
    <Glyph {...p}>
      <ellipse cx="12" cy="8" rx="5" ry="3" />
      <path d="M7 8v8a5 5 0 0 0 10 0V8" />
    </Glyph>
  ),
  beer: (p) => (
    <Glyph {...p}>
      <path d="M6 7h9v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Z" />
      <path d="M15 10h2.5a2.5 2.5 0 0 1 0 5H15" />
      <path d="M8 4c1 .8 2 .8 3 0s2-.8 3 0" />
    </Glyph>
  ),
  hotdrinks: (p) => (
    <Glyph {...p}>
      <path d="M5 9h11v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 5c.6.7 1.4.7 2 0M11 5c.6.7 1.4.7 2 0" />
    </Glyph>
  ),
  coffee: (p) => (
    <Glyph {...p}>
      <path d="M5 9h11v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 5c.6.7 1.4.7 2 0M11 5c.6.7 1.4.7 2 0" />
    </Glyph>
  ),
  tea: (p) => (
    <Glyph {...p}>
      <path d="M5 10h11v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" />
      <path d="M16 12h2a2 2 0 0 1 0 4h-2" />
      <path d="M9 6c1 1 2 1 3 0" />
    </Glyph>
  ),
  softdrinks: (p) => (
    <Glyph {...p}>
      <path d="M9 3h6l1 5H8L9 3Z" />
      <path d="M8 8h8l-1 13H9L8 8Z" />
      <path d="M10 12h4" />
    </Glyph>
  ),
  food: (p) => (
    <Glyph {...p}>
      <path d="M4 11h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2Z" />
      <path d="M7 11V8a2 2 0 0 1 2-2h0M12 11V7M17 11V8a2 2 0 0 0-2-2h0" />
      <path d="M6 17v2h12v-2" />
    </Glyph>
  ),
  snacks: (p) => (
    <Glyph {...p}>
      <path d="M7 8c2-3 8-3 10 0l2 4c1 3-1 7-5 8H10c-4-1-6-5-5-8l2-4Z" />
      <path d="M9 12h6M10 15h4" />
    </Glyph>
  ),
  dairy: (p) => (
    <Glyph {...p}>
      <path d="M8 4h8l1 4H7L8 4Z" />
      <path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8Z" />
    </Glyph>
  ),
  clothes: (p) => (
    <Glyph {...p}>
      <path d="M9 4 12 6l3-2 4 3-3 2v11H8V9L5 7l4-3Z" />
    </Glyph>
  ),
  sportswear: (p) => (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16M7 7c2 2 8 2 10 0M7 17c2-2 8-2 10 0" />
    </Glyph>
  ),
  luxury: (p) => (
    <Glyph {...p}>
      <path d="M6 9h12l-1 11H7L6 9Z" />
      <path d="M6 9 9 4h6l3 5" />
      <path d="M12 13v4" />
    </Glyph>
  ),
  watches: (p) => (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 9v3.5l2 1.5M9 3.5h6M9 20.5h6" />
    </Glyph>
  ),
  beauty: (p) => (
    <Glyph {...p}>
      <path d="M9 10h6v10H9V10Z" />
      <path d="M10 10V7a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
      <path d="M9 14h6" />
    </Glyph>
  ),
  tech: (p) => (
    <Glyph {...p}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </Glyph>
  ),
  pharma: (p) => (
    <Glyph {...p}>
      <path d="M10 3h4v6l4 4v5a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-5l4-4V3Z" />
      <path d="M12 13v5M9.5 15.5h5" />
    </Glyph>
  ),
  airlines: (p) => (
    <Glyph {...p}>
      <path d="M3 13 21 8l-3 5 3 5-18-5 5-1.5L8 7l2 .5" />
    </Glyph>
  ),
  banks: (p) => (
    <Glyph {...p}>
      <path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 18h18M12 4 3 9h18L12 4Z" />
    </Glyph>
  ),
  instruments: (p) => (
    <Glyph {...p}>
      <path d="M9 18a3 3 0 1 0 0-0.01" />
      <path d="M12 18V6l7-2v10" />
      <path d="M19 14a3 3 0 1 0 0-0.01" />
    </Glyph>
  ),
  toys: (p) => (
    <Glyph {...p}>
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <circle cx="9" cy="13" r="1.5" />
      <circle cx="15" cy="13" r="1.5" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Glyph>
  ),
  trees: (p) => (
    <Glyph {...p}>
      <path d="M12 21V12" />
      <path d="M12 4 7 11h10L12 4Z" />
      <path d="M12 9 6.5 16h11L12 9Z" />
    </Glyph>
  ),
  flowers: (p) => (
    <Glyph {...p}>
      <circle cx="12" cy="10" r="2.5" />
      <path d="M12 7.5C12 5 10 4 10 4s0 2.5 2 3.5C14 6.5 14 4 14 4s-2 1-2 3.5Z" />
      <path d="M12 12.5c0 2.5 2 3.5 2 3.5s0-2.5-2-3.5c-2 1-2 3.5-2 3.5s2-1 2-3.5Z" />
      <path d="M9.5 10c-2.5 0-3.5-2-3.5-2s2.5 0 3.5 2c-1 2-3.5 2-3.5 2s1-2 3.5-2Z" />
      <path d="M14.5 10c2.5 0 3.5-2 3.5-2s-2.5 0-3.5 2c1 2 3.5 2 3.5 2s-1-2-3.5-2Z" />
      <path d="M12 13v8" />
    </Glyph>
  ),
  animals: (p) => (
    <Glyph {...p}>
      <circle cx="12" cy="13" r="5" />
      <path d="M8 9 6.5 5.5 10 7.5M16 9l1.5-3.5L14 7.5" />
      <circle cx="10.5" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
    </Glyph>
  ),
  birds: (p) => (
    <Glyph {...p}>
      <path d="M4 14c4-6 9-8 14-7-2 3-2 6 0 9-5 0-9-1-14-2Z" />
      <path d="M16 8c2-2 4-3 5-3" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </Glyph>
  ),
  mushrooms: (p) => (
    <Glyph {...p}>
      <path d="M5 12c0-4.5 3-8 7-8s7 3.5 7 8H5Z" />
      <path d="M10 12v7a2 2 0 0 0 4 0v-7" />
    </Glyph>
  ),
};

const FALLBACK = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 8v8M8 12h8" />
  </Glyph>
);

const ALL = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </Glyph>
);

export function categoryIcon(categoryId: string, className = "pill__icon") {
  const Comp = ICONS[categoryId] ?? FALLBACK;
  return <Comp className={className} />;
}

export function allCategoriesIcon(className = "pill__icon") {
  return <ALL className={className} />;
}
