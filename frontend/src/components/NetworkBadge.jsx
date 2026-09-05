import { NETWORK_NAME } from '../utils/format'

// The green dot pill in the navbar.
export default function NetworkBadge({ className = '', tone = 'dark' }) {
  const shell =
    tone === 'dark'
      ? 'border-white/15 bg-white/5 text-cream-100'
      : 'border-line-strong bg-white text-ink-soft'

  return (
    <span
      className={
        'inline-flex items-center gap-2 rounded-sm border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ' +
        shell +
        ' ' +
        className
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified-500 opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verified-500" />
      </span>
      {NETWORK_NAME}
    </span>
  )
}
