import { useEffect, useId, useRef, useState } from "react";

export type PrefOption<T extends string> = {
  value: T;
  label: string;
  icon: PrefIconName;
};

export type PrefIconName =
  | "any"
  | "alone"
  | "two"
  | "small"
  | "group"
  | "either"
  | "indoor"
  | "outdoor"
  | "strategy"
  | "casual"
  | "craft"
  | "sport"
  | "puzzle"
  | "kids"
  | "ritual"
  | "eraAny"
  | "ancient"
  | "traditional"
  | "modern";

const PREF_SELECT_OPEN = "ludus:pref-select-open";

function PrefIcon({ name }: { name: PrefIconName }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "any":
    case "eraAny":
    case "either":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      );
    case "alone":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19c1.2-3.2 3.2-4.8 6.5-4.8S17.8 15.8 19 19" />
        </svg>
      );
    case "two":
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8.5" r="2.6" />
          <circle cx="15.5" cy="8.5" r="2.6" />
          <path d="M3.8 19c.9-2.6 2.4-3.9 4.7-3.9s3.8 1.3 4.7 3.9" />
          <path d="M11 19c.9-2.6 2.4-3.9 4.7-3.9s3.8 1.3 4.7 3.9" />
        </svg>
      );
    case "small":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="8" r="2.3" />
          <circle cx="16.5" cy="8" r="2.3" />
          <circle cx="12" cy="10.5" r="2" />
          <path d="M3.5 19c.8-2.3 2-3.4 4-3.4s3.2 1.1 4 3.4" />
          <path d="M12.5 19c.8-2.3 2-3.4 4-3.4s3.2 1.1 4 3.4" />
        </svg>
      );
    case "group":
      return (
        <svg {...common}>
          <circle cx="7" cy="9" r="2.2" />
          <circle cx="12" cy="7.5" r="2.4" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M3.2 19c.7-2 1.8-3 3.6-3s2.9 1 3.6 3" />
          <path d="M8.8 19c.8-2.3 2.1-3.5 3.8-3.5s3 1.2 3.8 3.5" />
          <path d="M13.6 19c.7-2 1.8-3 3.6-3s2.9 1 3.6 3" />
        </svg>
      );
    case "indoor":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M7 10.5V20h10v-9.5" />
          <path d="M10.5 20v-5h3v5" />
        </svg>
      );
    case "outdoor":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="3.2" />
          <path d="M12 3.5v1.6M12 13.2v1.6M5.8 9H4.2M19.8 9h-1.6M7.2 4.8l1.1 1.1M15.7 13.3l1.1 1.1M16.8 4.8l-1.1 1.1M8.3 13.3l-1.1 1.1" />
          <path d="M4 19h16" />
        </svg>
      );
    case "strategy":
      return (
        <svg {...common}>
          <path d="M7 20V10l5-6 5 6v10" />
          <path d="M9.5 20v-5.5h5V20" />
          <circle cx="12" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "casual":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "craft":
      return (
        <svg {...common}>
          <path d="M8 20h8" />
          <path d="M10 20V11l2-3 2 3v9" />
          <path d="M7 8.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
        </svg>
      );
    case "sport":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4.5 9.5h15M4.5 14.5h15" />
        </svg>
      );
    case "puzzle":
      return (
        <svg {...common}>
          <path d="M8 4h3.2a2 2 0 0 1 4 0H18v3.2a2 2 0 0 1 0 4V14H14.8a2 2 0 0 0-4 0H8v-2.8a2 2 0 0 1 0-4V4z" />
        </svg>
      );
    case "kids":
      return (
        <svg {...common}>
          <circle cx="12" cy="7.5" r="3" />
          <path d="M6.5 20c1-3.5 3-5.2 5.5-5.2S17 16.5 18 20" />
          <path d="M8 11.5c-.8.4-1.4 1.2-1.6 2.2M16 11.5c.8.4 1.4 1.2 1.6 2.2" />
        </svg>
      );
    case "ritual":
      return (
        <svg {...common}>
          <path d="M12 3.5 14.2 9H20l-4.4 3.4L17.2 18 12 14.7 6.8 18l1.6-5.6L4 9h5.8L12 3.5z" />
        </svg>
      );
    case "ancient":
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M6 19V10l6-5 6 5v9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case "traditional":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7.5v9M8.5 12h7" />
        </svg>
      );
    case "modern":
      return (
        <svg {...common}>
          <rect x="5" y="6" width="14" height="12" rx="2" />
          <path d="M9 18h6M12 6V4" />
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

type Props<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: PrefOption<T>[];
  onChange: (value: T) => void;
};

export function PrefIconSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const instanceId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const onPeerOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== instanceId) setOpen(false);
    };
    window.addEventListener(PREF_SELECT_OPEN, onPeerOpen);
    return () => window.removeEventListener(PREF_SELECT_OPEN, onPeerOpen);
  }, [instanceId]);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(PREF_SELECT_OPEN, { detail: instanceId }));
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, instanceId]);

  return (
    <div
      className={`field pref-icon-field${open ? " is-open" : ""}`}
      ref={rootRef}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        className={`pref-icon-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pref-icon-glyph">
          <PrefIcon name={selected.icon} />
        </span>
        <span className="pref-icon-label">{selected.label}</span>
        <span className="pref-icon-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          id={listId}
          className="pref-icon-menu"
          role="listbox"
          aria-labelledby={`${id}-label`}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`pref-icon-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="pref-icon-glyph">
                    <PrefIcon name={opt.icon} />
                  </span>
                  <span className="pref-icon-label">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
