import { NavLink } from "react-router-dom";
import { useJournal } from "../hooks/useJournal";

export function Header() {
  const { counts } = useJournal();

  return (
    <header className="site-header">
      <div className="inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          Ludus Atlas
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/collection">Collection</NavLink>
          <NavLink to="/journal">
            Journal
            {counts.total > 0 ? (
              <span className="nav-count" aria-label={`${counts.total} in journal`}>
                {counts.total}
              </span>
            ) : null}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
