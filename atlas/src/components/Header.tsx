import { NavLink } from "react-router-dom";

export function Header() {
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
        </nav>
      </div>
    </header>
  );
}
