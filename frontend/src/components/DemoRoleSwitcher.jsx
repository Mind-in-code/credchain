import { DEMO_ROLES, useWallet } from '../hooks/useWallet'

// Demo only. Lets us show the issuer, student and verifier views on stage
// without juggling three MetaMask accounts.
export default function DemoRoleSwitcher({ className = '' }) {
  const { roleId, switchRole } = useWallet()

  return (
    <div
      className={'flex items-center rounded-sm border border-white/15 ' + className}
      role="group"
      aria-label="Demo role"
    >
      {DEMO_ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => switchRole(r.id)}
          aria-pressed={roleId === r.id}
          title={r.description}
          className={
            'px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ' +
            (roleId === r.id
              ? 'bg-cream-50 text-navy'
              : 'text-cream-100/60 hover:text-cream-50')
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
