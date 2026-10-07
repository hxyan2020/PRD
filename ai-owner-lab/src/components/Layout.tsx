import { NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/curriculum', label: 'Curriculum' },
  { to: '/tracker', label: 'Tracker' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/ops', label: 'Ops playbook' },
  { to: '/career', label: 'Career' },
]

export function Layout() {
  const { percent, completedCount } = useProgress()

  return (
    <div className="shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            OWNLAB
            <small>AI Product Owner Academy</small>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
              {link.to === '/tracker' ? (
                <span className="nav-progress" aria-label={`${percent} percent complete`}>
                  {completedCount}/30
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          OWNLAB · 30 days to true AI product ownership · Technical fluency without becoming an
          engineer
        </p>
      </footer>
    </div>
  )
}
