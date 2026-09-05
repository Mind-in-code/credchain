export default function Input({
  label,
  hint,
  error,
  id,
  className = '',
  as = 'input',
  children,
  ...rest
}) {
  const inputId = id || rest.name
  const base = [
    'w-full rounded-sm border bg-white px-3.5 text-sm text-ink placeholder:text-ink-muted',
    'transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy',
    error ? 'border-revoked-500' : 'border-line-strong',
    as === 'textarea' ? 'py-3 min-h-[92px]' : 'h-11',
    className,
  ].join(' ')

  const Tag = as

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label mb-1.5 block">
          {label}
        </label>
      )}
      <Tag id={inputId} className={base} {...rest}>
        {children}
      </Tag>
      {error ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-revoked-500">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}
