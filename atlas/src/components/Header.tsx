import { NavLink, useNavigate } from "react-router-dom";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";

export function Header() {
  const { counts } = useJournal();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

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
            {isLoggedIn && counts.total > 0 ? (
              <span className="nav-count" aria-label={`${counts.total} in journal`}>
                {counts.total}
              </span>
            ) : null}
          </NavLink>
          {isLoggedIn ? (
            <div className="nav-account">
              <span className="nav-email" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                className="nav-logout"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
