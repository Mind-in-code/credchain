import { Check, Loader2, TriangleAlert } from 'lucide-react'

// The stage names come from credentialService onProgress.
export const MINT_STAGES = [
  { id: 'preparing', label: 'Preparing metadata' },
  { id: 'uploading', label: 'Uploading to IPFS' },
  { id: 'awaiting_wallet', label: 'Waiting for wallet confirmation' },
  { id: 'confirming', label: 'Confirming transaction' },
  { id: 'done', label: 'Credential minted' },
]

export const REVOKE_STAGES = [
  { id: 'preparing', label: 'Preparing transaction' },
  { id: 'awaiting_wallet', label: 'Waiting for wallet confirmation' },
  { id: 'confirming', label: 'Confirming transaction' },
  { id: 'done', label: 'Credential revoked' },
]

export default function TransactionProgress({ stages = MINT_STAGES, current, failed = false }) {
  const currentIndex = stages.findIndex((s) => s.id === current)

  return (
    <ol className="divide-y divide-line border border-line">
      {stages.map((stage, index) => {
        const isDone = currentIndex > index || current === 'done'
        const isActive = currentIndex === index && current !== 'done'
        const isFailedHere = failed && currentIndex === index

        return (
          <li
            key={stage.id}
            className={
              'flex items-center gap-3 px-4 py-3 ' + (isActive ? 'bg-cream-50' : 'bg-white')
            }
          >
            <span
              className={
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border ' +
                (isFailedHere
                  ? 'border-revoked-500 bg-revoked-50 text-revoked-500'
                  : isDone
                    ? 'border-verified-500 bg-verified-500 text-white'
                    : isActive
                      ? 'border-gold-500 bg-gold-50 text-gold-600'
                      : 'border-line-strong bg-white text-line-strong')
              }
            >
              {isFailedHere ? (
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
              ) : isDone ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>
            <span
              className={
                'font-mono text-[11px] uppercase tracking-[0.1em] ' +
                (isFailedHere
                  ? 'font-semibold text-revoked-600'
                  : isDone
                    ? 'text-ink'
                    : isActive
                      ? 'font-semibold text-ink'
                      : 'text-ink-muted')
              }
            >
              {stage.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
