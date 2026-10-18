import Link from "next/link";

/** In-app admin path that keeps GitHub Pages `basePath` (`/PRD/crmp-admin`). */
export function AdminLink({
  href,
  className,
  children,
  "data-testid": testId,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  const external = /^(https?:)?\/\//.test(href);
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" data-testid={testId}>
        {children}
      </a>
    );
  }
  const path = href.startsWith("/") ? href : `/${href}`;
  return (
    <Link href={path} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}
