import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type FilterSelectOption = {
  value: string;
  label: string;
  /** Optional leading visual (flag, icon). */
  leading?: ReactNode;
};

type Props = {
  id: string;
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  /** Leading visual for the closed trigger (defaults to selected option’s leading). */
  triggerLeading?: ReactNode;
};

const FILTER_SELECT_OPEN = "ludus:filter-select-open";

export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  triggerLeading,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const instanceId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const leading = triggerLeading ?? selected?.leading;

  useEffect(() => {
    const onPeerOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== instanceId) setOpen(false);
    };
    window.addEventListener(FILTER_SELECT_OPEN, onPeerOpen);
    return () => window.removeEventListener(FILTER_SELECT_OPEN, onPeerOpen);
  }, [instanceId]);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(
      new CustomEvent(FILTER_SELECT_OPEN, { detail: instanceId }),
    );
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

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const needed = Math.min(320, window.innerHeight * 0.45);
    setDropUp(spaceBelow < needed && spaceAbove > spaceBelow);
  }, [open, options.length]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const active = menuRef.current.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  return (
    <div
      className={`field filter-select${open ? " is-open" : ""}${dropUp ? " is-drop-up" : ""}`}
      ref={rootRef}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        className={`filter-select-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
      >
        {leading ? (
          <span className="filter-select-leading">{leading}</span>
        ) : null}
        <span className="filter-select-label">{selected?.label ?? value}</span>
        <span className="filter-select-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          ref={menuRef}
          id={listId}
          className="filter-select-menu"
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
                  className={`filter-select-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.leading ? (
                    <span className="filter-select-leading">{opt.leading}</span>
                  ) : null}
                  <span className="filter-select-label">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
