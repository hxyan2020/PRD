import {
  fundingStageIconId,
  type FundingStageIconId,
} from "@/lib/funding-stages";

type Props = {
  stage?: string;
  id?: FundingStageIconId;
  className?: string;
};

/** Compact monoline glyph for fundraising-round filters. */
export function FundingRoundIcon({ stage = "", id, className }: Props) {
  const icon = id ?? fundingStageIconId(stage);
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
      aria-hidden
    >
      <IconPath id={icon} />
    </svg>
  );
}

function IconPath({ id }: { id: FundingStageIconId }) {
  switch (id) {
    case "all":
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8M12 8v8" />
        </>
      );
    case "preseed":
      return (
        <>
          <circle cx="12" cy="14" r="5" />
          <path d="M12 4v5" />
        </>
      );
    case "seed":
      return (
        <>
          <path d="M12 19V9" />
          <path d="M12 9c-2.8 0-4.8-2.2-4.8-4.5C10 4.5 12 6.8 12 9Z" />
          <path d="M12 11c2.5-.4 4.5-2.2 4.8-4.5-2.8.4-4.5 2.2-4.8 4.5Z" />
        </>
      );
    case "series":
      return (
        <>
          <path d="M5 16h14" />
          <path d="M7 16V10M12 16V7M17 16v-4" />
          <path d="M5 19h14" />
        </>
      );
    case "late":
      return (
        <>
          <path d="M4 17 9 9l3.5 5L15 8l5 9" />
          <path d="M4 19h16" />
        </>
      );
    case "public":
      return (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M4 10h16" />
          <path d="M8 14h3M14 14h2" />
        </>
      );
    case "acquired":
      return (
        <>
          <path d="M7 12h10" />
          <path d="M14 8l4 4-4 4" />
          <rect x="4" y="7" width="6" height="10" rx="1" />
        </>
      );
    case "bootstrapped":
      return (
        <>
          <path d="M8 18V9l4-3 4 3v9" />
          <path d="M10 18v-4h4v4" />
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
