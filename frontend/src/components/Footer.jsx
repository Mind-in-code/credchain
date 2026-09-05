import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { CONTRACT_ADDRESS } from '../data/mockIssuers'
import { NETWORK_NAME, shortAddress } from '../utils/format'

export default function Footer() {
  return (
    <footer className="bg-navy text-cream-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-gold-500/60 text-gold-500">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-semibold tracking-[0.06em] text-cream-50">
              CREDCHAIN
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-cream-100/50 sm:inline">
              Soulbound Credential Registry
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cream-100/60">
            <span>
              Network: <span className="text-cream-50">{NETWORK_NAME}</span>
            </span>
            <span>
              Contract: <span className="text-cream-50">{shortAddress(CONTRACT_ADDRESS)}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-cream-100/50 md:flex-row md:items-center md:justify-between">
          <p>Built for HackBlox 2026 | Demo data on Sepolia testnet</p>
          <div className="flex gap-6">
            <Link to="/verify" className="hover:text-cream-50">
              Verify
            </Link>
            <Link to="/issuer" className="hover:text-cream-50">
              Issuer
            </Link>
            <Link to="/issuer/issue" className="hover:text-cream-50">
              Issue
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
