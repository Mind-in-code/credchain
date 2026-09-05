export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-sm border border-line-strong bg-cream-50 text-ink-soft">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
