import { Loader2 } from 'lucide-react'

export default function LoadingState({ text = 'Loading', className = '' }) {
  return (
    <div className={'flex flex-col items-center justify-center gap-3 py-20 text-center ' + className}>
      <Loader2 className="h-6 w-6 animate-spin text-gold-600" aria-hidden="true" />
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{text}</p>
    </div>
  )
}
