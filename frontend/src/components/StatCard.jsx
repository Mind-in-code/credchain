export default function StatCard({ label, value, icon: Icon, delta, hint, tone = 'ink' }) {
  const valueTone = {
    ink: 'text-ink',
    verified: 'text-verified-500',
    revoked: 'text-revoked-500',
    gold: 'text-gold-600',
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />}
      </div>
      <p
        className={
          'mt-4 font-serif text-4xl font-semibold tracking-tight ' +
          (valueTone[tone] || valueTone.ink)
        }
      >
        {value}
      </p>
      {delta && (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-verified-500">
          {delta}
        </p>
      )}
      {hint && <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
