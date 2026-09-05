import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import CertificateCard from '../CertificateCard'
import { parseTokenId, isValidAddress } from '../../utils/format'
import { DEMO_MODE } from '../../utils/network'

export default function Hero({ certificate, stats }) {
  const counts = stats || { issued: 0, issuers: 0, valid: 0, revoked: 0 }
  const STATS = [
    { value: String(counts.issued), label: 'Credentials Issued' },
    { value: String(counts.issuers), label: 'Whitelisted Issuers' },
    { value: String(counts.valid), label: 'Currently Valid' },
    { value: String(counts.revoked), label: 'Revoked' },
  ]

  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const value = query.trim()
    if (!value) {
      setError('Enter a credential ID or a wallet address.')
      return
    }
    if (isValidAddress(value)) {
      navigate('/verify/wallet/' + value)
      return
    }
    const tokenId = parseTokenId(value)
    if (tokenId === null) {
      setError('Enter a credential ID like 1284, or a full wallet address.')
      return
    }
    navigate('/verify/' + tokenId)
  }

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14 lg:py-20">
        <div className="animate-fade-in">
          <span className="chip">Academic Credential Registry | ERC-721 Soulbound</span>

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Immutable Academic Credentials on the Blockchain.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            Universities issue tamper-evident, non-transferable digital certificates. Employers
            verify them in seconds from a credential ID or a QR code, with no email to a registrar
            office.
          </p>

          <form onSubmit={onSubmit} className="mt-8 border border-line-strong bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setError('')
                  }}
                  aria-label="Credential ID or wallet address"
                  placeholder="1284 or 0x3fD2..."
                  className="h-11 w-full rounded-sm border border-line-strong bg-cream-50 pl-9 pr-3 font-mono text-sm text-ink placeholder:text-ink-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-navy px-5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-cream-50 transition-colors hover:bg-navy-700"
              >
                Verify Record
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
              {error ? (
                <span className="text-revoked-500">{error}</span>
              ) : (
                <span className="text-verified-500">
                  {DEMO_MODE
                    ? 'Try 1284 for a valid record, or 1290 for a revoked one'
                    : 'Enter a credential ID like 1, or a full wallet address'}
                </span>
              )}
              <span className="text-ink-muted">No wallet needed</span>
            </div>
          </form>

          <dl className="mt-9 grid grid-cols-2 gap-y-6 border-t border-line pt-7 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="font-serif text-3xl font-semibold text-ink">{s.value}</dd>
                <dt className="label mt-1.5">{s.label}</dt>
              </div>
            ))}
          </dl>

          {DEMO_MODE && (
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              <span>Issuing institutions:</span>
              <span className="text-ink-soft">Tech University</span>
              <span className="text-line-strong">|</span>
              <span className="text-ink-soft">Northbridge University</span>
              <span className="text-line-strong">|</span>
              <span className="text-ink-soft">Meridian Institute</span>
            </p>
          )}
        </div>

        <div className="animate-fade-in border border-line bg-white p-3 shadow-lift">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="label">Folio Record: #{certificate ? certificate.tokenId : '----'}</span>
            <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-verified-500">
              Valid Credential
            </span>
          </div>
          <CertificateCard certificate={certificate} size="lg" />
        </div>
      </div>
    </section>
  )
}
