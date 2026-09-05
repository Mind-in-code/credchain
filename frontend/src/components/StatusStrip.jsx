import { CONTRACT_ADDRESS } from '../data/mockIssuers'
import { NETWORK_NAME, shortAddress } from '../utils/format'

// The thin mono strip under the navbar. Real project facts only.
export default function StatusStrip() {
  const items = [
    { label: 'Network', value: NETWORK_NAME },
    { label: 'Contract', value: shortAddress(CONTRACT_ADDRESS) },
    { label: 'Standard', value: 'ERC-721 Soulbound' },
  ]

  return (
    <div className="border-b border-line bg-cream-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft sm:px-6">
        {items.map((item, i) => (
          <span key={item.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-line-strong">|</span>}
            <span className="text-ink-muted">{item.label}:</span>
            <span className="font-medium text-ink">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
