"use client";

import { ProfileBubbleIcon } from "@/components/ProfileBubbleIcon";
import type { ProfileBubble } from "@/lib/profile-options";

type Props = {
  label: string;
  hint?: string;
  bubbles: ProfileBubble[];
  /** Selected labels (case-insensitive match to bubble labels). */
  selected: string[];
  /** Draft text in the custom input. */
  draft: string;
  onDraftChange: (value: string) => void;
  onToggleBubble: (label: string) => void;
  onAddCustom: () => void;
  /** When true, interactions show the login gate instead of mutating. */
  locked: boolean;
  onLockedAttempt: () => void;
  placeholder: string;
  /** Multi-select chips (skills/domains/markets) vs single value (major/business). */
  multi?: boolean;
  /** Label for the submit control next to the input. */
  actionLabel: string;
  inputMode?: "text" | "search";
};

export function ProfileBubbleField({
  label,
  hint,
  bubbles,
  selected,
  draft,
  onDraftChange,
  onToggleBubble,
  onAddCustom,
  locked,
  onLockedAttempt,
  placeholder,
  multi = true,
  actionLabel,
  inputMode = "text",
}: Props) {
  const selectedSet = new Set(selected.map((s) => s.toLowerCase()));

  function guard(action: () => void) {
    if (locked) {
      onLockedAttempt();
      return;
    }
    action();
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
        {label}
      </legend>
      {hint ? <p className="text-xs text-mist/90">{hint}</p> : null}

      <div className="flex flex-wrap gap-2">
        {bubbles.map((bubble) => {
          const active = selectedSet.has(bubble.label.toLowerCase());
          return (
            <button
              key={bubble.id}
              type="button"
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                active
                  ? "border-celadon/50 bg-celadon/15 text-foam"
                  : "border-black/12 bg-black/[0.02] text-mist hover:border-black/25 hover:text-foam"
              }`}
              onClick={() => guard(() => onToggleBubble(bubble.label))}
            >
              <ProfileBubbleIcon icon={bubble.icon} className="h-4 w-4 shrink-0 text-celadon" />
              <span>{bubble.label}</span>
            </button>
          );
        })}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          guard(() => onAddCustom());
        }}
      >
        <input
          className="field"
          value={draft}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete="off"
          aria-label={placeholder}
          onFocus={() => {
            if (locked) onLockedAttempt();
          }}
          onChange={(e) => {
            if (locked) {
              onLockedAttempt();
              return;
            }
            onDraftChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (locked && e.key !== "Tab") {
              e.preventDefault();
              onLockedAttempt();
            }
          }}
        />
        <button type="submit" className="btn-ghost btn-block-mobile shrink-0">
          {actionLabel}
        </button>
      </form>

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-ink-2 px-2.5 py-1 text-xs text-foam"
                onClick={() => guard(() => onToggleBubble(item))}
                aria-label={`Remove ${item}`}
              >
                {item}
                <span aria-hidden className="text-mist">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}
