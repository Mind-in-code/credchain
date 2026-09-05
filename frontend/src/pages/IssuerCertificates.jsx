import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpDown,
  Ban,
  CircleCheck,
  CircleSlash,
  ExternalLink,
  ScrollText,
  Search,
  TriangleAlert,
  Wallet,
  WifiOff,
} from 'lucide-react'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import WalletModal from '../components/WalletModal'
import RevocationModal from '../components/RevocationModal'
import TransactionModal from '../components/TransactionModal'
import { REVOKE_STAGES } from '../components/TransactionProgress'
import { useToast } from '../components/Toast'
import { useWallet } from '../hooks/useWallet'
import { getIssuedBy, isIssuer, revokeCertificate } from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import {
  HAS_EXPLORER,
  displayTokenId,
  explorerTxUrl,
  formatDate,
  shortAddress,
} from '../utils/format'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'valid', label: 'Valid' },
  { id: 'revoked', label: 'Revoked' },
]

export default function IssuerCertificates() {
  const { isConnected, address, connect } = useWallet()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(true)
  const [certificates, setCertificates] = useState([])
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadError, setLoadError] = useState('')

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  // Revoke flow.
  const [toRevoke, setToRevoke] = useState(null)
  const [txOpen, setTxOpen] = useState(false)
  const [stage, setStage] = useState(null)
  const [txResult, setTxResult] = useState(null)
  const [txError, setTxError] = useState('')
  // Reasons are frontend only, the contract stores just the revoked flag.
  const [reasons, setReasons] = useState({})

  useEffect(() => {
    if (!isConnected || !address) {
      setCertificates([])
      return undefined
    }

    let active = true
    setLoading(true)

    setLoadError('')
    Promise.all([isIssuer(address), getIssuedBy(address)])
      .then(([allowed, issued]) => {
        if (!active) return
        setAuthorized(allowed)
        setCertificates(issued.map(certificateView))
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setCertificates([])
        setLoadError(err.message || 'Could not reach the blockchain.')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isConnected, address, reloadKey])

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = certificates
      .filter((c) => {
        if (filter === 'valid') return !c.revoked
        if (filter === 'revoked') return c.revoked
        return true
      })
      .filter((c) => {
        if (!term) return true
        return (
          (c.student || '').toLowerCase().includes(term) ||
          (c.course || '').toLowerCase().includes(term) ||
          (c.owner || '').toLowerCase().includes(term) ||
          String(c.tokenId).includes(term)
        )
      })

    const sorted = rows.slice().sort((a, b) => {
      if (sortBy === 'status') {
        // Valid before revoked when ascending.
        const av = a.revoked ? 1 : 0
        const bv = b.revoked ? 1 : 0
        if (av !== bv) return av - bv
        return a.tokenId - b.tokenId
      }
      // Date, falling back to token id when two share a date.
      const ad = new Date(a.date || 0).getTime() || a.tokenId
      const bd = new Date(b.date || 0).getTime() || b.tokenId
      if (ad !== bd) return ad - bd
      return a.tokenId - b.tokenId
    })

    return sortDir === 'desc' ? sorted.reverse() : sorted
  }, [certificates, filter, search, sortBy, sortDir])

  const total = certificates.length
  const revokedCount = certificates.filter((c) => c.revoked).length
  const validCount = total - revokedCount

  const confirmRevoke = async (certificate, reason) => {
    setToRevoke(null)
    setTxError('')
    setTxResult(null)
    setStage('preparing')
    setTxOpen(true)

    try {
      const result = await revokeCertificate(certificate.tokenId, setStage, reason)
      setTxResult(result)
      setReasons((prev) => ({ ...prev, [certificate.tokenId]: reason }))
      toast('Credential ' + displayTokenId(certificate.tokenId) + ' revoked')
      setReloadKey((k) => k + 1)
    } catch (err) {
      setStage('error')
      setTxError(err.message || 'The transaction failed.')
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={Wallet}
          title="Connect your issuer wallet to see the registry"
          description="This page lists every credential minted from your wallet, and lets you revoke one."
          action={
            <Button onClick={() => setWalletModalOpen(true)}>
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Connect Wallet
            </Button>
          }
        />
        <WalletModal
          open={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onConnect={connect}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        to="/issuer"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to dashboard
      </Link>

      <p className="label-gold mt-5">Issuer Registry / Issued Certificates</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">
        Issued Certificates
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Every credential minted from {shortAddress(address)}, read straight from the contract.
        Revoking is permanent.
      </p>

      {!authorized && (
        <div className="mt-6 flex items-start gap-3 border border-gold-500 bg-gold-50 px-5 py-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
          <p className="text-sm text-ink-soft">
            This wallet is not a whitelisted issuer, so it has not minted anything. Connect the
            issuer wallet to see its registry.
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState text="Loading issued credentials" />
      ) : loadError ? (
        <div className="mt-8">
          <EmptyState
            icon={WifiOff}
            title="Could not reach the blockchain"
            description={loadError}
            action={
              <Button onClick={() => setReloadKey((k) => k + 1)} variant="secondary">
                Try Again
              </Button>
            }
          />
        </div>
      ) : (
        <section className="card mt-8">
          <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap">
              {FILTERS.map((f) => {
                const count =
                  f.id === 'all' ? total : f.id === 'valid' ? validCount : revokedCount
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                    className={
                      '-ml-px border px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors first:ml-0 ' +
                      (filter === f.id
                        ? 'border-navy bg-navy text-cream-50'
                        : 'border-line-strong bg-white text-ink-muted hover:text-ink')
                    }
                  >
                    {f.label} ({count})
                  </button>
                )
              })}
            </div>

            <div className="relative lg:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search credentials"
                placeholder="Search by student, wallet or token ID"
                className="h-10 w-full rounded-sm border border-line-strong bg-cream-50 pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-serif text-xl font-semibold text-ink">No credentials match</p>
              <p className="mt-2 text-sm text-ink-soft">
                {total === 0
                  ? 'This wallet has not issued any credentials yet.'
                  : 'Clear the filter or the search box to see every record.'}
              </p>
              {total === 0 && (
                <div className="mt-6">
                  <Button to="/issuer/issue" variant="gold" disabled={!authorized}>
                    Issue Credential
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="bg-navy">
                    <Th>Student</Th>
                    <Th>Credential</Th>
                    <Th>Token ID</Th>
                    <SortableTh
                      label="Issued"
                      active={sortBy === 'date'}
                      dir={sortDir}
                      onClick={() => toggleSort('date')}
                    />
                    <SortableTh
                      label="Status"
                      active={sortBy === 'status'}
                      dir={sortDir}
                      onClick={() => toggleSort('status')}
                    />
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr
                      key={c.tokenId}
                      className={
                        'border-b border-line align-middle last:border-b-0 ' +
                        (c.revoked ? 'bg-revoked-50/30' : 'hover:bg-cream-50')
                      }
                    >
                      <td className="px-4 py-4">
                        <Link
                          to={'/certificates/' + c.tokenId}
                          className="text-sm font-semibold text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:text-gold-600 hover:decoration-gold-500"
                        >
                          {c.student || 'Unknown'}
                        </Link>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                          {c.studentId ? c.studentId + ' | ' : ''}
                          {shortAddress(c.owner, 6, 4)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-ink">{c.course || 'Unknown'}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                          Grade {c.grade || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={'/certificates/' + c.tokenId}
                          className={
                            'font-mono text-xs font-semibold underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-gold-500 ' +
                            (c.revoked
                              ? 'text-ink-muted line-through hover:text-ink'
                              : 'text-gold-600 hover:text-gold-700')
                          }
                        >
                          {displayTokenId(c.tokenId)}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-[11px] text-ink-soft">
                          {formatDate(c.date) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {c.revoked ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 border border-revoked-100 bg-revoked-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-revoked-600">
                              <CircleSlash className="h-3 w-3" aria-hidden="true" />
                              Revoked
                            </span>
                            {reasons[c.tokenId] && (
                              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-muted">
                                {reasons[c.tokenId]}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-verified-500">
                            <CircleCheck className="h-3 w-3" aria-hidden="true" />
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={'/certificates/' + c.tokenId}
                            className="border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                          >
                            View
                          </Link>
                          <Link
                            to={'/verify/' + c.tokenId}
                            className="border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                          >
                            Verify
                          </Link>
                          {HAS_EXPLORER && c.txHash && (
                            <a
                              href={explorerTxUrl(c.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                              aria-label={'View transaction for ' + displayTokenId(c.tokenId)}
                            >
                              Tx
                              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                            </a>
                          )}
                          {!c.revoked && (
                            <button
                              type="button"
                              onClick={() => setToRevoke(c)}
                              className="inline-flex items-center gap-1 border border-revoked-100 bg-revoked-50 px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-revoked-600 transition-colors hover:border-revoked-500"
                            >
                              <Ban className="h-2.5 w-2.5" aria-hidden="true" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Showing {visible.length} of {total} credentials
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Sorted by {sortBy === 'date' ? 'issue date' : 'status'}, {sortDir === 'desc' ? 'newest first' : 'oldest first'}
            </p>
          </div>
        </section>
      )}

      <RevocationModal
        open={Boolean(toRevoke)}
        certificate={toRevoke}
        onClose={() => setToRevoke(null)}
        onConfirm={confirmRevoke}
      />

      <TransactionModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        stage={stage}
        stages={REVOKE_STAGES}
        result={txResult}
        error={txError}
        title="Revoking Credential"
        successTitle="Credential Revoked"
        successMessage="The credential is now marked invalid on-chain. It still sits in the recipient wallet."
        actions={
          txResult ? (
            <Button variant="secondary" onClick={() => setTxOpen(false)} className="flex-1">
              Close
            </Button>
          ) : null
        }
      />
    </div>
  )
}

function Th({ children }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-cream-100"
    >
      {children}
    </th>
  )
}

function SortableTh({ label, active, dir, onClick }) {
  return (
    <th scope="col" className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        aria-label={'Sort by ' + label}
        className={
          'inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ' +
          (active ? 'text-gold-500' : 'text-cream-100 hover:text-gold-500')
        }
      >
        {label}
        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
        {active && <span className="text-[9px]">{dir === 'desc' ? 'desc' : 'asc'}</span>}
      </button>
    </th>
  )
}
