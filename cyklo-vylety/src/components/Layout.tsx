import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="app-shell">
      <div className="topo" aria-hidden="true" />
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="34" height="34">
              <circle cx="15" cy="31" r="8.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="33.5" cy="31" r="8.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <path
                d="M15 31 L24 18 L31 18 M24 18 L27.5 31 M21 24 H29.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="brand-kicker">deník na kolo</span>
            <span className="brand-name">Cyklo výlety</span>
          </span>
        </NavLink>
        <nav className="top-nav" aria-label="Hlavní navigace">
          <NavLink to="/" end>
            Přehled
          </NavLink>
          <NavLink to="/vylety">Výlety</NavLink>
          <NavLink to="/vylety/novy" className="nav-cta">
            Nový výlet
          </NavLink>
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Mobilní navigace">
        <NavLink to="/" end>
          <span className="nav-ico" aria-hidden="true">
            ⌂
          </span>
          Přehled
        </NavLink>
        <NavLink to="/vylety">
          <span className="nav-ico" aria-hidden="true">
            ☰
          </span>
          Výlety
        </NavLink>
        <NavLink to="/vylety/novy" className="add-link">
          <span className="nav-ico plus" aria-hidden="true">
            +
          </span>
          Přidat
        </NavLink>
      </nav>
    </div>
  )
}
