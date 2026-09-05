import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { copyToClipboard, explorerAddressUrl, shortAddress, NETWORK_NAME } from '../utils/format'
import { useToast } from './Toast'
import WalletModal from './WalletModal'

export default function WalletButton() {
  const { isConnected, address, connect, disconnect, role } = useWallet()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const onCopy = async () => {
    const ok = await copyToClipboard(address)
    toast(ok ? 'Address copied' : 'Could not copy address', ok ? 'success' : 'error')
    setMenuOpen(false)
  }

  if (!isConnected) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-white/20 px-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-cream-100 transition-colors hover:bg-white/10"
        >
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          Connect
        </button>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onConnect={connect} />
      </>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        className="inline-flex h-9 items-center gap-2 rounded-sm border border-white/15 bg-white/5 pl-1.5 pr-2 text-left transition-colors hover:bg-white/10"
      >
        <span className="h-6 w-6 rounded-sm bg-gradient-to-br from-gold-300 to-gold-700" />
        <span className="leading-tight">
          <span className="block font-sans text-[11px] font-semibold text-cream-50">
            {role.name}
          </span>
          <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-gold-500">
            {role.label}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-cream-100/50" aria-hidden="true" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-40 mt-2 w-72 animate-scale-in rounded-sm border border-line bg-white p-1.5 shadow-lift">
          <div className="border border-line bg-cream-50 p-3">
            <p className="label">Connected as {role.label}</p>
            <p className="mt-1.5 break-all font-mono text-[11px] text-ink">{address}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-verified-500">
              {NETWORK_NAME}
            </p>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="mt-1 flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-ink-soft hover:bg-cream-50"
          >
            <Copy className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            Copy address
          </button>
          <a
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-ink-soft hover:bg-cream-50"
          >
            <ExternalLink className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            View on explorer
          </a>
          <button
            type="button"
            onClick={() => {
              disconnect()
              setMenuOpen(false)
              toast('Wallet disconnected', 'info')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-revoked-500 hover:bg-revoked-50"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
