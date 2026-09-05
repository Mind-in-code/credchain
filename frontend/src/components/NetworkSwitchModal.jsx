import { useState } from 'react'
import { Loader2, Network, TriangleAlert } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { useWallet } from '../hooks/useWallet'
import { CHAIN_ID, NETWORK_NAME } from '../utils/network'

const KNOWN_CHAINS = {
  1: 'Ethereum',
  11155111: 'Sepolia Testnet',
  31337: 'Hardhat Local',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum One',
}

function chainLabel(id) {
  if (id === null || id === undefined) return 'an unknown network'
  return KNOWN_CHAINS[id] || 'chain ' + id
}

// Shown whenever the connected wallet sits on a chain the app does not use.
// Reads and the Verify page keep working, only writes would fail.
export default function NetworkSwitchModal() {
  const { isWrongNetwork, walletChainId, switchNetwork, switching } = useWallet()
  const [failed, setFailed] = useState('')
  const [dismissed, setDismissed] = useState(false)

  if (!isWrongNetwork || dismissed) return null

  const onSwitch = async () => {
    setFailed('')
    try {
      await switchNetwork()
    } catch (err) {
      setFailed(err.message || 'Could not switch the network.')
    }
  }

  return (
    <Modal
      open
      onClose={() => setDismissed(true)}
      title="Wrong Network"
      size="md"
      hideClose={switching}
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-gold-50 text-gold-700">
          <TriangleAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
          Your wallet is on the wrong network
        </h3>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          CredChain runs on {NETWORK_NAME}. Your wallet is currently on{' '}
          {chainLabel(walletChainId)}, so issuing and revoking will fail until you switch.
        </p>
      </div>

      <dl className="mt-6 divide-y divide-line border border-line">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="label">Wallet is on</dt>
          <dd className="font-mono text-[11px] text-revoked-600">{chainLabel(walletChainId)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="label">App needs</dt>
          <dd className="font-mono text-[11px] text-verified-600">
            {NETWORK_NAME} ({CHAIN_ID})
          </dd>
        </div>
      </dl>

      {failed && (
        <p className="mt-4 border border-revoked-100 bg-revoked-50 px-4 py-3 text-sm text-revoked-600">
          {failed}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="gold" onClick={onSwitch} disabled={switching} className="flex-1">
          {switching ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Switching
            </>
          ) : (
            <>
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              Switch to {NETWORK_NAME}
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setDismissed(true)}
          disabled={switching}
          className="flex-1"
        >
          Keep Browsing
        </Button>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        Verifying still works on any network
      </p>
    </Modal>
  )
}
