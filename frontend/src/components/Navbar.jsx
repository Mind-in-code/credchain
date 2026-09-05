import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import NetworkBadge from './NetworkBadge'
import DemoRoleSwitcher from './DemoRoleSwitcher'
import WalletButton from './WalletButton'
import { DEMO_MODE } from '../utils/network'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/verify', label: 'Verify' },
  { to: '/issuer', label: 'Issuer' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    'px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ' +
    (isActive ? 'bg-white/10 text-cream-50' : 'text-cream-100/70 hover:text-cream-50')

  return (
    <header className="sticky top-0 z-40 bg-navy">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-gold-500/60 text-gold-500">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="leading-none">
            <span className="block font-serif text-lg font-semibold tracking-[0.06em] text-cream-50">
              CREDCHAIN
            </span>
            <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.22em] text-gold-500">
              Academic Ledger
            </span>
          </span>
        </Link>

        <div className="hidden items-center lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <NetworkBadge />
          {DEMO_MODE && <DemoRoleSwitcher />}
          <Link
            to="/verify"
            className="inline-flex h-9 items-center rounded-sm bg-gold-500 px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-navy transition-colors hover:bg-gold-300"
          >
            Verify Credential
          </Link>
          <WalletButton />
        </div>

        <button
          type="button"
          className="rounded-sm p-2 text-cream-100 hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-navy px-4 py-4 lg:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            <NetworkBadge />
            {DEMO_MODE && <DemoRoleSwitcher />}
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  )
}
