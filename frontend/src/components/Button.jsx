import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-navy text-cream-50 hover:bg-navy-700 disabled:bg-ink-muted',
  gold: 'bg-gold-500 text-navy hover:bg-gold-600 hover:text-cream-50 disabled:bg-gold-300',
  secondary:
    'border border-line-strong bg-white text-ink hover:border-navy hover:bg-cream-50 disabled:text-ink-muted',
  ghost: 'text-ink-soft hover:bg-cream-200 hover:text-ink',
  danger: 'bg-revoked-500 text-white hover:bg-revoked-600 disabled:bg-revoked-100',
}

const SIZES = {
  sm: 'h-8 px-3 text-[11px] gap-1.5',
  md: 'h-10 px-4 text-xs gap-2',
  lg: 'h-12 px-6 text-xs gap-2',
}

// Buttons are uppercase mono to match the ledger feel of the product.
export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-sm font-mono font-medium uppercase tracking-[0.1em] transition-colors duration-150',
    'disabled:cursor-not-allowed',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    )
  }

  const Tag = as || 'button'
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
