import { CircleCheck, CircleSlash, CircleDashed } from 'lucide-react'

const STATES = {
  valid: {
    label: 'Verified and anchored',
    icon: CircleCheck,
    className: 'bg-verified-50 text-verified-600 border-verified-100',
  },
  revoked: {
    label: 'Revoked by issuer',
    icon: CircleSlash,
    className: 'bg-revoked-50 text-revoked-600 border-revoked-100',
  },
  pending: {
    label: 'Pending',
    icon: CircleDashed,
    className: 'bg-gold-50 text-gold-700 border-gold-100',
  },
}

export default function StatusBadge({ status = 'valid', label, size = 'md' }) {
  const state = STATES[status] || STATES.valid
  const Icon = state.icon
  const sizing =
    size === 'sm' ? 'px-2 py-0.5 text-[9px] gap-1' : 'px-2.5 py-1 text-[10px] gap-1.5'

  return (
    <span
      className={
        'inline-flex items-center rounded-sm border font-mono font-medium uppercase tracking-[0.1em] ' +
        sizing +
        ' ' +
        state.className
      }
    >
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
      {label || state.label}
    </span>
  )
}
