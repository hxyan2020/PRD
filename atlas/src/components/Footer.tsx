export function Footer({ total }: { total?: number }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          <strong style={{ color: "var(--mist)", fontFamily: "var(--font-display)" }}>
            Ludus Atlas
          </strong>{" "}
          catalogs toys and games across civilizations. Fundamentally identical
          forms appear as variations under one entry.
          {typeof total === "number" ? ` ${total.toLocaleString()} entries in this edition.` : null}
        </p>
      </div>
    </footer>
  );
}
