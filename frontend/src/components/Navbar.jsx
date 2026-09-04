import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

// ── Simulated investment power indicator ─────────────────────────────────────
// This value is static/demo — it is NOT connected to any real portfolio API.
// It communicates the concept: "your investments back your purchases."
const DEMO_INVESTMENT_POWER = 185000

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

// ── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={[
        'text-sm font-medium transition-colors px-1 py-0.5',
        isActive
          ? 'text-white'
          : 'text-slate-300 hover:text-white',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--color-navy)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
          aria-label="1Fi EMI Store — home"
        >
          {/* Logo mark */}
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black"
            style={{ background: 'var(--color-indigo)' }}
            aria-hidden="true"
          >
            1Fi
          </span>
          <span className="text-white font-bold text-base tracking-tight hidden sm:block">
            EMI Store
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          className="hidden md:flex items-center gap-5"
          aria-label="Main navigation"
        >
          <NavLink to="/">Products</NavLink>
        </nav>

        {/* ── Investment power chip + mobile toggle ── */}
        <div className="flex items-center gap-3 ml-auto">

          {/* Investment power indicator — desktop */}
          <div
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Simulated demo value — not a real financial figure"
          >
            {/* Emerald dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--color-emerald)' }}
              aria-hidden="true"
            />
            <div className="leading-tight">
              <p className="text-slate-400 fi-eyebrow" style={{ fontSize: '0.6rem' }}>
                Investment Power
              </p>
              <p className="text-white font-bold text-sm fi-number">
                {fmt(DEMO_INVESTMENT_POWER)}
              </p>
            </div>
            {/* Demo label */}
            <span
              className="fi-badge ml-1"
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '0.55rem',
              }}
            >
              DEMO
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 space-y-1"
          style={{ background: 'var(--color-navy)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Products
          </Link>

          {/* Investment power — mobile */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 mt-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--color-emerald)' }}
              aria-hidden="true"
            />
            <div>
              <p className="fi-eyebrow text-slate-400" style={{ fontSize: '0.6rem' }}>Investment Power (Demo)</p>
              <p className="text-white font-bold text-sm fi-number">{fmt(DEMO_INVESTMENT_POWER)}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
