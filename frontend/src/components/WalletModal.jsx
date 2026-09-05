import { useEffect, useState } from 'react'
import { Loader2, Wallet, Link2 } from 'lucide-react'
import Modal from './Modal'

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    detail: 'Browser extension wallet',
    icon: Wallet,
    recommended: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    detail: 'Scan with a mobile wallet',
    icon: Link2,
    recommended: false,
  },
]

export default function WalletModal({ open, onClose, onConnect }) {
  const [pending, setPending] = useState(null)

  useEffect(() => {
    if (!open) setPending(null)
  }, [open])

  const choose = async (wallet) => {
    setPending(wallet.name)
    // One second of "Connecting to MetaMask..." before the mock connection lands.
    setTimeout(async () => {
      await onConnect()
      setPending(null)
      onClose()
    }, 1000)
  }

  return (
    <Modal
      open={open}
      onClose={pending ? undefined : onClose}
      title="Connect Wallet"
      description="Issuing needs a whitelisted wallet. Verifying never does."
      hideClose={Boolean(pending)}
    >
      {pending ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold-600" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
            Connecting to {pending}
          </p>
          <p className="text-xs text-ink-muted">Approve the request in your wallet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {WALLETS.map((w) => {
            const Icon = w.icon
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => choose(w)}
                className={
                  'flex w-full items-center gap-4 border p-4 text-left transition-colors ' +
                  (w.recommended
                    ? 'border-gold-500 bg-gold-50 hover:bg-gold-100'
                    : 'border-line-strong bg-white hover:border-navy')
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-navy text-gold-500">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{w.name}</span>
                    {w.recommended && (
                      <span className="border border-gold-500 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-gold-700">
                        Recommended
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                    {w.detail}
                  </span>
                </span>
              </button>
            )
          })}
          <p className="pt-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Demo mode, no real wallet is contacted yet
          </p>
        </div>
      )}
    </Modal>
  )
}
