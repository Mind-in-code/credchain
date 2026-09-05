import { ArrowRight, Building2, Clock, QrCode, ScrollText, User, Users, Zap, Boxes } from 'lucide-react'

const OLD_WAY = [
  { label: 'Student', icon: User },
  { label: 'Paper Certificate', icon: ScrollText },
  { label: 'Employer', icon: Users },
  { label: 'University Office', icon: Building2 },
]

const NEW_WAY = [
  { label: 'Student', icon: User },
  { label: 'QR or Wallet', icon: QrCode },
  { label: 'Blockchain', icon: Boxes },
]

function Flow({ steps, outcome, outcomeIcon: OutcomeIcon, tone }) {
  const tones = {
    old: {
      chip: 'border-line-strong bg-cream-50 text-ink-soft',
      arrow: 'text-line-strong',
      outcome: 'border-line-strong bg-cream-200 text-ink',
    },
    new: {
      chip: 'border-verified-100 bg-white text-verified-500',
      arrow: 'text-verified-100',
      outcome: 'border-verified-500 bg-verified-50 text-verified-600',
    },
  }
  const t = tones[tone]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.label} className="flex items-center gap-2">
            <span
              className={
                'inline-flex items-center gap-2 border px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ' +
                t.chip
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <ArrowRight className={'h-3.5 w-3.5 shrink-0 ' + t.arrow} aria-hidden="true" />
            )}
          </div>
        )
      })}
      <ArrowRight className={'h-3.5 w-3.5 shrink-0 ' + t.arrow} aria-hidden="true" />
      <span
        className={
          'inline-flex items-center gap-2 border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ' +
          t.outcome
        }
      >
        <OutcomeIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {outcome}
      </span>
    </div>
  )
}

export default function ProblemSection() {
  return (
    <section className="border-b border-line bg-cream-200/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="label-gold">The Problem</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Verifying a degree still takes days
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-soft">
          Paper and PDF certificates are easy to fake and slow to check. Every verification means
          another email to a university office.
        </p>

        <div className="mt-10 space-y-4">
          <div className="card p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="border border-line-strong bg-cream-200 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Old Way
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                Manual, trust based, slow
              </span>
            </div>
            <Flow steps={OLD_WAY} outcome="Days or weeks" outcomeIcon={Clock} tone="old" />
          </div>

          <div className="card border-verified-100 p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="border border-verified-500 bg-verified-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-verified-600">
                CredChain
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                On-chain, public, instant
              </span>
            </div>
            <Flow steps={NEW_WAY} outcome="Instant" outcomeIcon={Zap} tone="new" />
          </div>
        </div>
      </div>
    </section>
  )
}
