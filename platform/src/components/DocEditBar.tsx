"use client";

export function DocEditBar({
  zh,
  editing,
  busy,
  dirty,
  localOnly,
  message,
  onEdit,
  onCancel,
  onSave,
  onReset,
}: {
  zh: boolean;
  editing: boolean;
  busy?: boolean;
  dirty?: boolean;
  localOnly?: boolean;
  message?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="action-row">
        {editing ? (
          <>
            <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy || !dirty}>
              {zh ? "儲存" : "Save"}
            </button>
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>
              {zh ? "取消" : "Cancel"}
            </button>
            <button type="button" className="btn" onClick={onReset} disabled={busy}>
              {zh ? "還原種子稿" : "Reset to seed"}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            {zh ? "編輯文件" : "Edit document"}
          </button>
        )}
      </div>
      {message ? <p className="text-xs text-teal-800">{message}</p> : null}
      {localOnly ? (
        <p className="text-[11px] text-[var(--muted)]">
          {zh ? "公開快照：變更只存在這個瀏覽器。" : "Public snapshot: edits stay in this browser."}
        </p>
      ) : null}
      {editing ? (
        <p className="text-[11px] text-[var(--muted)]">
          {zh
            ? "本機儲存進 SQLite（admin_doc_edits）。還原會丟掉此語系的覆寫。"
            : "Localhost saves to SQLite (admin_doc_edits). Reset drops the overlay for this language."}
        </p>
      ) : null}
    </div>
  );
}
