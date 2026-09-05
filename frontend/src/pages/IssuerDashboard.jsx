import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleCheck,
  CircleSlash,
  Copy,
  ExternalLink,
  FileText,
  Ban,
  ShieldPlus,
  Plus,
  ScrollText,
  Search,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import Button from '../components/Button'
import StatCard from '../components/StatCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import WalletModal from '../components/WalletModal'
import Modal from '../components/Modal'
import Input from '../components/Input'
import TransactionModal from '../components/TransactionModal'
import { REVOKE_STAGES } from '../components/TransactionProgress'
import { useToast } from '../components/Toast'
import { useWallet } from '../hooks/useWallet'
import {
  addIssuer,
  getIssuedBy,
  getOwner,
  isIssuer,
  revokeCertificate,
} from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import { getIssuerByAddress } from '../data/mockIssuers'
import {
  CONTRACT_ADDRESS,
  copyToClipboard,
  displayTokenId,
  explorerTxUrl,
  formatDate,
  shortAddress,
  isValidAddress,
  shortHash,
  HAS_EXPLORER,
  NETWORK_NAME,
} from '../utils/format'

const FILTERS = [
  { id: 'all', label: 'All Issued' },
  { id: 'valid', label: 'Valid' },
  { id: 'revoked', label: 'Revoked' },
]

export default function IssuerDashboard() {
  const { isConnected, address, connect, role } = useWallet()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(true)
  const [certificates, setCertificates] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [contractOwner, setContractOwner] = useState('')

  // Admin only: whitelist a new issuer wallet.
  const [newIssuer, setNewIssuer] = useState('')
  const [newIssuerError, setNewIssuerError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addStage, setAddStage] = useState(null)
  const [addResult, setAddResult] = useState(null)
  const [addError, setAddError] = useState('')

  // Revoke flow: confirm dialog, then the transaction modal.
  const [toRevoke, setToRevoke] = useState(null)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeStage, setRevokeStage] = useState(null)
  const [revokeResult, setRevokeResult] = useState(null)
  const [revokeError, setRevokeError] = useState('')

  const issuerProfile = getIssuerByAddress(address)

  useEffect(() => {
    if (!isConnected || !address) {
      setCertificates([])
      return undefined
    }

    let active = true
    setLoading(true)

    Promise.all([isIssuer(address), getIssuedBy(address), getOwner()]).then(
      ([allowed, issued, owner]) => {
        if (!active) return
        setAuthorized(allowed)
        setCertificates(issued.map(certificateView))
        setContractOwner(owner || '')
        setLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [isConnected, address, reloadKey])

  const total = certificates.length
  const revoked = certificates.filter((c) => c.revoked).length
  const active = total - revoked

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return certificates
      .filter((c) => {
        if (filter === 'valid') return !c.revoked
        if (filter === 'revoked') return c.revoked
        return true
      })
      .filter((c) => {
        if (!term) return true
        return (
          c.student.toLowerCase().includes(term) ||
          c.course.toLowerCase().includes(term) ||
          c.owner.toLowerCase().includes(term) ||
          String(c.tokenId).includes(term)
        )
      })
      .sort((a, b) => b.tokenId - a.tokenId)
  }, [certificates, filter, search])

  const confirmRevoke = async () => {
    const cert = toRevoke
    setToRevoke(null)
    if (!cert) return

    setRevokeError('')
    setRevokeResult(null)
    setRevokeStage('preparing')
    setRevokeOpen(true)

    try {
      const result = await revokeCertificate(cert.tokenId, setRevokeStage)
      setRevokeResult(result)
      toast('Credential ' + displayTokenId(cert.tokenId) + ' revoked')
      // Pull the list again so the row and the stat cards update.
      setReloadKey((k) => k + 1)
    } catch (err) {
      setRevokeStage('error')
      setRevokeError(err.message || 'The transaction failed.')
    }
  }

  const submitAddIssuer = async () => {
    const value = newIssuer.trim()
    if (!isValidAddress(value)) {
      setNewIssuerError('Enter a valid address: 0x followed by 40 hex characters.')
      return
    }

    setNewIssuerError('')
    setAddError('')
    setAddResult(null)
    setAddStage('preparing')
    setAddOpen(true)

    try {
      const result = await addIssuer(value, setAddStage)
      setAddResult(result)
      toast('Issuer whitelisted')
      setNewIssuer('')
      setReloadKey((k) => k + 1)
    } catch (err) {
      setAddStage('error')
      setAddError(err.message || 'The transaction failed.')
    }
  }

  const copyHash = async (value) => {
    const ok = await copyToClipboard(value)
    toast(ok ? 'Transaction hash copied' : 'Could not copy', ok ? 'success' : 'error')
  }

  const isOwner =
    Boolean(contractOwner) &&
    Boolean(address) &&
    contractOwner.toLowerCase() === address.toLowerCase()

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to access the issuer dashboard"
          description="Only whitelisted institution wallets can issue credentials. Verifying a credential never needs a wallet."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Connect Wallet
            </Button>
          }
        />
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onConnect={connect} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="label-gold">Issuer Registry / Whitelisted Wallet</p>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">
            Issuer Dashboard
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {issuerProfile ? issuerProfile.institution : role.name}
            <span className="mx-2 text-line-strong">|</span>
            {issuerProfile ? issuerProfile.department : 'Office of the Registrar'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip">Wallet: {shortAddress(address)}</span>
            {authorized ? (
              <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-verified-500">
                <CircleCheck className="h-3 w-3" aria-hidden="true" />
                Whitelisted Issuer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 border border-gold-500 bg-gold-50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-gold-700">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                Not Whitelisted
              </span>
            )}
            {isOwner && (
              <span className="inline-flex items-center gap-1.5 border border-navy bg-navy px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-cream-50">
                <ShieldPlus className="h-3 w-3" aria-hidden="true" />
                Contract Admin
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button to="/issuer/certificates" variant="secondary">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Full Registry
          </Button>
          <Button to="/issuer/issue" variant="gold" disabled={!authorized}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Issue Credential
          </Button>
        </div>
      </div>

      {!authorized && (
        <div className="mt-7 flex items-start gap-3 border border-gold-500 bg-gold-50 px-5 py-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-700">
              This wallet is not an authorized issuer
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              The contract admin has to whitelist {shortAddress(address)} before it can mint
              credentials. Switch the demo role to Issuer to see the full dashboard.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState text="Loading issued credentials" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Credentials"
              value={total}
              icon={ScrollText}
              hint="Minted from this wallet"
            />
            <StatCard
              label="Currently Valid"
              value={active}
              icon={CircleCheck}
              tone="verified"
              hint="Not revoked by the issuer"
            />
            <StatCard
              label="Revoked"
              value={revoked}
              icon={CircleSlash}
              tone="revoked"
              hint="Marked invalid on-chain"
            />
            <StatCard
              label="Pending"
              value={0}
              icon={FileText}
              tone="gold"
              hint="No queued mints"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <p className="label">Contract</p>
              <p className="mt-2.5 break-all font-mono text-sm text-ink">{CONTRACT_ADDRESS}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
                <div>
                  <dt className="label">Network</dt>
                  <dd className="mt-1 font-mono text-[11px] text-ink">{NETWORK_NAME}</dd>
                </div>
                <div>
                  <dt className="label">Standard</dt>
                  <dd className="mt-1 font-mono text-[11px] text-ink">ERC-721 Soulbound</dd>
                </div>
                <div>
                  <dt className="label">Metadata</dt>
                  <dd className="mt-1 font-mono text-[11px] text-ink">Pinned to IPFS</dd>
                </div>
              </dl>
            </div>

            <div className="card p-5">
              <p className="label">Issuer Note</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Minting is permanent. A credential can never be transferred or deleted, only revoked
                by the wallet that issued it.
              </p>
            </div>
          </div>

          {/* Admin only: whitelist an issuer wallet. */}
          {isOwner && (
            <section className="card mt-6 border-gold-500">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <ShieldPlus className="h-4 w-4 text-gold-600" aria-hidden="true" />
                  <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                    Admin: Whitelist an Issuer
                  </h2>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold-600">
                  Contract owner only
                </span>
              </div>

              <div className="p-5">
                <p className="text-sm text-ink-soft">
                  Only whitelisted wallets can mint credentials. You are connected as the contract
                  owner, so you can add one.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label="Issuer wallet address"
                      name="newIssuer"
                      value={newIssuer}
                      onChange={(e) => {
                        setNewIssuer(e.target.value)
                        setNewIssuerError('')
                      }}
                      placeholder="0x..."
                      error={newIssuerError}
                      className="font-mono"
                    />
                  </div>
                  <Button variant="gold" onClick={submitAddIssuer} className="sm:mb-0">
                    <ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add Issuer
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Registry table */}
          <section className="card mt-8">
            <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                  Issued Credentials Registry
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Every credential minted from this wallet, read from the contract.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-verified-500">
                <span className="h-1.5 w-1.5 rounded-full bg-verified-500" />
                Registry synced
              </span>
            </div>

            <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap">
                {FILTERS.map((f) => {
                  const count =
                    f.id === 'all' ? total : f.id === 'valid' ? active : revoked
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      aria-pressed={filter === f.id}
                      className={
                        'border px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors -ml-px first:ml-0 ' +
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

              <div className="relative lg:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Filter credentials"
                  placeholder="Filter by name, course, wallet or ID"
                  className="h-10 w-full rounded-sm border border-line-strong bg-cream-50 pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-serif text-xl font-semibold text-ink">No credentials match</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {total === 0
                    ? 'Issue your first credential and it will appear here and on the verify page straight away.'
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
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="bg-navy">
                      {[
                        'Token ID',
                        'Recipient',
                        'Credential',
                        'Issued',
                        'Transaction',
                        'Status',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-cream-100"
                        >
                          {h}
                        </th>
                      ))}
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
                          <span
                            className={
                              'font-mono text-xs font-semibold ' +
                              (c.revoked ? 'text-ink-muted line-through' : 'text-gold-600')
                            }
                          >
                            {displayTokenId(c.tokenId)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-ink">{c.student}</p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                            {c.studentId} | {shortAddress(c.owner, 6, 4)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-ink">{c.course}</p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                            Grade {c.grade}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-[11px] text-ink-soft">
                            {formatDate(c.date)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => copyHash(c.txHash)}
                            className="inline-flex items-center gap-1.5 border border-line-strong bg-cream-50 px-2 py-1 font-mono text-[10px] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                            aria-label={'Copy transaction hash for ' + displayTokenId(c.tokenId)}
                          >
                            {shortHash(c.txHash)}
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {c.revoked ? (
                            <span className="inline-flex items-center gap-1.5 border border-revoked-100 bg-revoked-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-revoked-600">
                              <CircleSlash className="h-3 w-3" aria-hidden="true" />
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-verified-500">
                              <CircleCheck className="h-3 w-3" aria-hidden="true" />
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={'/verify/' + c.tokenId}
                              className="border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                            >
                              Verify
                            </Link>
                            {HAS_EXPLORER && (
                              <a
                                href={explorerTxUrl(c.txHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
                              >
                                Explorer
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
                Revoking is permanent and cannot be undone
              </p>
            </div>
          </section>
        </>
      )}

      {/* Simple confirm before revoking. The full modal with reasons is Phase B. */}
      <Modal
        open={Boolean(toRevoke)}
        onClose={() => setToRevoke(null)}
        title="Revoke Credential"
        size="md"
      >
        {toRevoke && (
          <div>
            <p className="text-sm leading-relaxed text-ink-soft">
              Revoking marks this credential invalid on-chain. It stays in the recipient wallet but
              will show as Revoked everywhere it is verified. This cannot be undone.
            </p>

            <dl className="mt-5 divide-y divide-line border border-line">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="label">Token ID</dt>
                <dd className="font-mono text-sm font-semibold text-gold-600">
                  {displayTokenId(toRevoke.tokenId)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="label">Recipient</dt>
                <dd className="text-sm font-medium text-ink">{toRevoke.student || 'Unknown'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="label">Credential</dt>
                <dd className="text-sm text-ink">{toRevoke.course || 'Unknown'}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="danger" onClick={confirmRevoke} className="flex-1">
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                Confirm Revocation
              </Button>
              <Button variant="secondary" onClick={() => setToRevoke(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <TransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        stage={addStage}
        stages={REVOKE_STAGES.map((st) =>
          st.id === 'done' ? { id: 'done', label: 'Issuer whitelisted' } : st
        )}
        result={addResult}
        error={addError}
        title="Whitelisting Issuer"
        successTitle="Issuer Whitelisted"
        successMessage="This wallet can now mint credentials from the issuer dashboard."
        actions={
          addResult ? (
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">
              Close
            </Button>
          ) : null
        }
      />

      <TransactionModal
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        stage={revokeStage}
        stages={REVOKE_STAGES}
        result={revokeResult}
        error={revokeError}
        title="Revoking Credential"
        successTitle="Credential Revoked"
        successMessage="The credential is now marked invalid on-chain. It still sits in the recipient wallet."
        actions={
          revokeResult ? (
            <Button variant="secondary" onClick={() => setRevokeOpen(false)} className="flex-1">
              Close
            </Button>
          ) : null
        }
      />
    </div>
  )
}
