import { Link, NavLink } from 'react-router-dom'
import './SiteHeader.css'

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark">Mille</span>
        <span className="brand-sub">One Thousand Paintings</span>
      </Link>
      <nav className="nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
      </nav>
    </header>
  )
}
