import Link from "next/link";

/** In-app admin path that keeps GitHub Pages `basePath` (`/PRD/crmp-admin`). */
export function AdminLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = /^(https?:)?\/\//.test(href);
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  const path = href.startsWith("/") ? href : `/${href}`;
  return (
    <Link href={path} className={className}>
      {children}
    </Link>
  );
}
