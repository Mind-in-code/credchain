import { createContext, useCallback, useContext, useState } from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: Check, className: 'bg-verified-500 text-white' },
  error: { icon: TriangleAlert, className: 'bg-revoked-500 text-white' },
  info: { icon: Info, className: 'bg-navy text-cream-50' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, tone = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((list) => [...list, { id, message, tone }])
      setTimeout(() => dismiss(id), 3200)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info
          const Icon = tone.icon
          return (
            <div
              key={t.id}
              role="status"
              className={
                'pointer-events-auto flex animate-fade-in items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] shadow-lift ' +
                tone.className
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
