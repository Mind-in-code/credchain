import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 12480, suffix: '+', label: 'Credentials Issued' },
  { value: 98, suffix: '', label: 'Verified Institutions' },
  { value: 11920, suffix: '', label: 'Active' },
  { value: 2.4, suffix: ' sec', label: 'Average Verification', decimals: 1 },
]

function useCountUp(target, decimals = 0, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const run = () => {
      if (started.current) return
      started.current = true
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1)
        // ease out so the numbers settle instead of stopping dead
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(target * eased)
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) run()
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [target, duration])

  const display =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')

  return { ref, display }
}

function Stat({ stat }) {
  const { ref, display } = useCountUp(stat.value, stat.decimals || 0)
  return (
    <div ref={ref} className="border-l border-line pl-5 first:border-l-0 first:pl-0 sm:pl-6">
      <p className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {display}
        {stat.suffix}
      </p>
      <p className="label mt-2">{stat.label}</p>
    </div>
  )
}

export default function StatsRow() {
  return (
    <section className="border-b border-line bg-cream-200/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-9 flex flex-wrap items-center gap-3">
          <span className="border border-gold-500 bg-gold-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">
            Demo Data
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Illustrative figures only, not from the registry
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-9 lg:grid-cols-4">
          {STATS.map((s) => (
            <Stat key={s.label} stat={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
