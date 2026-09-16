export default function NotFound() {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
      <p className="font-serif text-2xl">This page could not be found.</p>
      <p className="mt-2 text-sm text-muted">
        Filters stay on the briefing file. Use the desk tabs or
        <a className="mx-1 text-gold underline decoration-gold/30" href="./">
          return to the daily briefing
        </a>
        .
      </p>
    </div>
  );
}
