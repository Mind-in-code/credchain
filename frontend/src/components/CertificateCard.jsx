import { QRCodeSVG } from 'qrcode.react'
import { QrCode, ShieldCheck } from 'lucide-react'
import { getSignatories } from '../data/mockIssuers'
import {
  CONTRACT_ADDRESS,
  displayTokenId,
  formatDate,
  shortAddress,
  NETWORK_NAME,
} from '../utils/format'

// The engraved certificate. Cream paper, gold rule border, gold corner brackets,
// shield seal, signature block and a navy ledger strip along the bottom.
export default function CertificateCard({
  certificate,
  size = 'lg',
  className = '',
  onQrClick,
}) {
  if (!certificate) return null

  const isSmall = size === 'sm'
  const revoked = Boolean(certificate.revoked)
  const signatories = getSignatories(certificate.institution)

  const verifyPath = '/verify/' + certificate.tokenId
  const verifyUrl =
    typeof window !== 'undefined' ? window.location.origin + verifyPath : verifyPath

  return (
    <div
      className={
        'relative overflow-hidden border bg-white ' +
        (revoked ? 'border-revoked-100' : 'border-line') +
        ' ' +
        className
      }
    >
      <div className={'p-2 ' + (revoked ? 'bg-revoked-50/40' : 'bg-white')}>
        {/* The paper itself, inside a thin gold rule. */}
        <div
          className={
            'relative border bg-cream-50 ' +
            (revoked ? 'border-revoked-100 grayscale-[65%]' : 'border-gold-300') +
            (isSmall ? ' px-5 py-6' : ' px-6 py-9 sm:px-12 sm:py-12')
          }
        >
          <CornerBrackets small={isSmall} revoked={revoked} />

          {revoked && (
            <p
              className={
                'pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-14deg] text-center font-serif font-bold uppercase tracking-[0.3em] text-revoked-500/20 ' +
                (isSmall ? 'text-3xl' : 'text-6xl sm:text-7xl')
              }
              aria-hidden="true"
            >
              Revoked
            </p>
          )}

          <div className="relative text-center">
            {/* Seal */}
            <span
              className={
                'mx-auto flex items-center justify-center rounded-sm bg-navy text-gold-500 ' +
                (isSmall ? 'h-9 w-9' : 'h-14 w-14')
              }
            >
              <ShieldCheck className={isSmall ? 'h-4 w-4' : 'h-7 w-7'} aria-hidden="true" />
            </span>

            <h3
              className={
                'mt-5 font-serif font-semibold uppercase text-ink ' +
                (isSmall
                  ? 'text-sm tracking-[0.12em]'
                  : 'text-xl tracking-[0.18em] sm:text-2xl')
              }
            >
              {certificate.institution || 'Institution'}
            </h3>
            <p
              className={
                'mt-1.5 font-mono uppercase tracking-[0.16em] text-ink-muted ' +
                (isSmall ? 'text-[8px]' : 'text-[10px]')
              }
            >
              {signatories.faculty}
            </p>

            <span
              className={
                'mt-5 inline-flex items-center gap-1.5 border font-mono font-medium uppercase tracking-[0.14em] ' +
                (revoked
                  ? 'border-revoked-100 bg-revoked-50 text-revoked-600'
                  : 'border-verified-100 bg-verified-50 text-verified-500') +
                (isSmall ? ' px-2 py-1 text-[8px]' : ' px-3 py-1.5 text-[10px]')
              }
            >
              <ShieldCheck className={isSmall ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
              {revoked ? 'Revoked Soulbound Token' : 'Non-Transferable Soulbound'}
            </span>

            <p
              className={
                'font-serif italic text-ink-soft ' +
                (isSmall ? 'mt-5 text-xs' : 'mt-8 text-base')
              }
            >
              This attests that
            </p>

            <p
              className={
                'font-serif font-semibold leading-tight text-ink ' +
                (isSmall ? 'mt-1.5 text-xl' : 'mt-3 text-4xl sm:text-5xl')
              }
            >
              {certificate.student || 'Student Name'}
            </p>

            <p
              className={
                'mx-auto max-w-lg text-ink-soft ' +
                (isSmall ? 'mt-3 text-[11px]' : 'mt-5 text-sm leading-relaxed')
              }
            >
              has successfully completed the requirements for
            </p>

            <p
              className={
                'font-serif font-semibold uppercase leading-snug text-ink ' +
                (isSmall ? 'mt-2 text-xs tracking-wide' : 'mt-4 text-xl tracking-wide sm:text-2xl')
              }
            >
              {certificate.course || 'Course or Programme'}
            </p>

            <p
              className={
                'font-mono uppercase tracking-[0.16em] text-gold-600 ' +
                (isSmall ? 'mt-2 text-[8px]' : 'mt-4 text-[10px]')
              }
            >
              Grade {certificate.grade || '-'}
              <span className="mx-2 text-line-strong">|</span>
              Issued {formatDate(certificate.date) || 'Pending'}
            </p>
          </div>

          {/* Signature block */}
          <div
            className={
              'relative border-t border-line-strong ' + (isSmall ? 'mt-6 pt-5' : 'mt-10 pt-8')
            }
          >
            <div className="flex items-end justify-between gap-4">
              <Signature
                name={signatories.registrar}
                role={signatories.registrarRole}
                small={isSmall}
              />

              <span
                className={
                  'flex shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold-500 text-gold-600 ' +
                  (isSmall ? 'h-10 w-10' : 'h-16 w-16')
                }
              >
                <ShieldCheck className={isSmall ? 'h-3 w-3' : 'h-5 w-5'} aria-hidden="true" />
                <span
                  className={
                    'mt-0.5 font-mono uppercase tracking-[0.1em] ' +
                    (isSmall ? 'text-[5px]' : 'text-[7px]')
                  }
                >
                  Verified
                </span>
              </span>

              <Signature
                name={signatories.dean}
                role={signatories.deanRole}
                small={isSmall}
                align="right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ledger strip */}
      <div className={'bg-navy ' + (isSmall ? 'px-4 py-3' : 'px-5 py-4 sm:px-6')}>
        <div className="flex items-end justify-between gap-4">
          <dl className="min-w-0 flex-1 space-y-1.5">
            <StripRow label="Token ID" value={displayTokenId(certificate.tokenId)} small={isSmall} />
            <StripRow label="Chain" value={NETWORK_NAME} small={isSmall} />
            <StripRow
              label="Contract"
              value={shortAddress(CONTRACT_ADDRESS)}
              small={isSmall}
            />
            <div className="pt-1">
              <span
                className={
                  'inline-flex items-center gap-1.5 font-mono font-medium uppercase tracking-[0.12em] ' +
                  (revoked ? 'text-revoked-500' : 'text-verified-500') +
                  (isSmall ? ' text-[8px]' : ' text-[9px]')
                }
              >
                <span
                  className={
                    'h-1.5 w-1.5 rounded-full ' +
                    (revoked ? 'bg-revoked-500' : 'bg-verified-500')
                  }
                />
                {revoked ? 'Revoked by issuer' : 'Bound to recipient wallet'}
              </span>
            </div>
          </dl>

          <div className="shrink-0 text-center">
            {onQrClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onQrClick(certificate)
                }}
                aria-label={'Open the verification QR for credential ' + certificate.tokenId}
                className="group block bg-white p-1.5 transition-opacity hover:opacity-80"
              >
                <QRCodeSVG value={verifyUrl} size={isSmall ? 44 : 62} level="M" />
              </button>
            ) : (
              <div className="bg-white p-1.5">
                <QRCodeSVG value={verifyUrl} size={isSmall ? 44 : 62} level="M" />
              </div>
            )}
            <p
              className={
                'mt-1.5 inline-flex items-center gap-1 font-mono uppercase tracking-[0.12em] text-cream-100/50 ' +
                (isSmall ? 'text-[7px]' : 'text-[8px]')
              }
            >
              {onQrClick && <QrCode className="h-2.5 w-2.5" aria-hidden="true" />}
              {onQrClick ? 'Tap to enlarge' : 'Scan to verify'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Signature({ name, role, small, align = 'left' }) {
  return (
    <div className={'min-w-0 flex-1 ' + (align === 'right' ? 'text-right' : 'text-left')}>
      <p
        className={
          'truncate border-b border-ink/30 pb-1 font-serif italic text-ink ' +
          (small ? 'text-[11px]' : 'text-base')
        }
      >
        {name}
      </p>
      <p
        className={
          'mt-1.5 font-mono uppercase tracking-[0.14em] text-ink-muted ' +
          (small ? 'text-[7px]' : 'text-[9px]')
        }
      >
        {role}
      </p>
    </div>
  )
}

function StripRow({ label, value, small }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt
        className={
          'shrink-0 font-mono uppercase tracking-[0.12em] text-cream-100/45 ' +
          (small ? 'text-[7px]' : 'text-[8px]')
        }
      >
        {label}
      </dt>
      <dd
        className={
          'truncate font-mono font-medium text-cream-50 ' + (small ? 'text-[9px]' : 'text-[11px]')
        }
      >
        {value}
      </dd>
    </div>
  )
}

function CornerBrackets({ small, revoked }) {
  const tone = revoked ? 'border-revoked-100' : 'border-gold-500'
  const size = small ? 'h-4 w-4' : 'h-7 w-7'
  const inset = small ? '8px' : '14px'

  const corners = [
    { key: 'tl', border: 'border-l-2 border-t-2', style: { top: inset, left: inset } },
    { key: 'tr', border: 'border-r-2 border-t-2', style: { top: inset, right: inset } },
    { key: 'bl', border: 'border-b-2 border-l-2', style: { bottom: inset, left: inset } },
    { key: 'br', border: 'border-b-2 border-r-2', style: { bottom: inset, right: inset } },
  ]

  return (
    <>
      {corners.map((c) => (
        <span
          key={c.key}
          aria-hidden="true"
          style={c.style}
          className={'pointer-events-none absolute ' + size + ' ' + c.border + ' ' + tone}
        />
      ))}
    </>
  )
}
