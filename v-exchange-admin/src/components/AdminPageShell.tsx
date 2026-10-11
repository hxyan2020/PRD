import type { ReactNode } from 'react';

interface AdminPageShellProps {
  children: ReactNode;
  title?: string;
  titleTag?: string;
}

/** White content panel with watermark, matching legacy admin embed pages. */
export function AdminPageShell({ children, title, titleTag }: AdminPageShellProps) {
  return (
    <div className="admin-page-shell">
      {(title || titleTag) && (
        <div className="admin-page-heading">
          {titleTag && <span className="admin-page-tag">{titleTag}</span>}
          {title && <h2 className="admin-page-title">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  );
}
