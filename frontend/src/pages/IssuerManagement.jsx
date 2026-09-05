import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  CircleCheck,
  CircleSlash,
  Info,
  ShieldPlus,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import WalletModal from '../components/WalletModal'
import AddIssuerModal from '../components/AddIssuerModal'
import TransactionModal from '../components/TransactionModal'
import { REVOKE_STAGES } from '../components/TransactionProgress'
import { useToast } from '../components/Toast'
import { useWallet } from '../hooks/useWallet'
import { addIssuer, getIssuers, getOwner, removeIssuer } from '../services/credentialService'
import { getIssuerByAddress } from '../data/mockIssuers'
import { HAS_EXPLORER, explorerAddressUrl, shortAddress } from '../utils/format'
import { loadIssuerLabels, saveIssuerLabel } from '../utils/issuerLabels'

const ROLE_ORDER = ['Super Admin', 'Department Head', 'Issuer']

// Labels come from localStorage first, then the seeded demo data, then a
// generated fallback. The contract stores none of this.
function labelFor(address, overrides) {
  const key = address.toLowerCase()
  if (overrides[key]) return overrides[key]

  const known = getIssuerByAddress(address)
  if (known) {
    return {
      name: known.name,
      role: known.role === 'Contract Admin' ? 'Super Admin' : 'Issuer',
      department: known.department || '',
    }
  }
  return { name: 'Issuer ' + shortAddress(address, 6, 4), role: 'Issuer', department: '' }
}

export default function IssuerManagement() {
  const { isConnected, address, connect } = useWallet()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [issuers, setIssuers] = useState([])
  const [owner, setOwner] = useState('')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [expanded, setExpanded] = useState({ root: true })
  // Seeded from localStorage so labels survive a refresh on this machine.
  const [overrides, setOverrides] = useState(() => loadIssuerLabels())

  const [txOpen, setTxOpen] = useState(false)
  const [stage, setStage] = useState(null)
  const [txResult, setTxResult] = useState(null)
  const [txError, setTxError] = useState('')
  const [txTitle, setTxTitle] = useState('Whitelisting Issuer')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [list, contractOwner] = await Promise.all([getIssuers(), getOwner()])
      setIssuers(list)
      setOwner(contractOwner || '')
    } catch (err) {
      setLoadError(err.message || 'Could not read the issuer list from the chain.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    load().then(() => {
      if (!active) return
    })
    return () => {
      active = false
    }
  }, [load, reloadKey])

  const isOwner =
    Boolean(owner) && Boolean(address) && owner.toLowerCase() === address.toLowerCase()

  // Build the display tree. The contract has no hierarchy, so this is grouping.
  const tree = useMemo(() => {
    const decorated = issuers.map((i) => ({ ...i, ...labelFor(i.address, overrides) }))

    // The contract owner sits at the root whether or not it is whitelisted.
    const ownerRow = decorated.find(
      (d) => owner && d.address.toLowerCase() === owner.toLowerCase()
    ) || {
      address: owner,
      active: true,
      ...labelFor(owner || '0x', overrides),
      role: 'Super Admin',
    }

    const rest = decorated.filter(
      (d) => !owner || d.address.toLowerCase() !== owner.toLowerCase()
    )

    return {
      root: { ...ownerRow, role: 'Super Admin' },
      heads: rest.filter((d) => d.role === 'Department Head'),
      issuers: rest.filter((d) => d.role !== 'Department Head'),
    }
  }, [issuers, owner, overrides])

  const runTx = async (label, fn, successMessage) => {
    setTxTitle(label)
    setTxError('')
    setTxResult(null)
    setStage('preparing')
    setTxOpen(true)
    try {
      const result = await fn()
      setTxResult(result)
      toast(successMessage)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setStage('error')
      setTxError(err.message || 'The transaction failed.')
    }
  }

  const onAdd = (form) => {
    setAddOpen(false)
    // Written to localStorage, and the returned map becomes the new state.
    const updated = saveIssuerLabel(form.address, {
      name: form.name,
      role: form.role,
      department: form.department,
    })
    setOverrides(updated)
    runTx('Whitelisting Issuer', () => addIssuer(form.address, setStage), 'Issuer whitelisted')
  }

  const onApprove = (issuer) =>
    runTx('Approving Issuer', () => addIssuer(issuer.address, setStage), 'Issuer approved')

  const onRevokeAccess = (issuer) =>
    runTx(
      'Revoking Issuer Access',
      () => removeIssuer(issuer.address, setStage),
      'Issuer access revoked'
    )

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to manage issuers"
          description="Only the contract admin can whitelist or remove issuer wallets. Anyone can read the list, but changing it needs the admin wallet."
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        to="/issuer"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label-gold">Issuer Registry / Access Control</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">
            Issuer Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Wallets allowed to mint credentials from this contract.
          </p>
        </div>

        <Button
          variant="gold"
          onClick={() => setAddOpen(true)}
          disabled={!isOwner}
          className="shrink-0"
        >
          <ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Issuer
        </Button>
      </div>

      {/* The honesty note. The contract has no roles. */}
      <div className="mt-6 flex items-start gap-3 border border-gold-500 bg-gold-50 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-soft">
          The contract keeps a flat whitelist: a wallet is either allowed to mint or it is not.
          Only the wallet address and its whitelisted status are on chain. The tiers, names and
          departments shown below are frontend labels saved in this browser, so they persist on
          this machine but are not enforced by the contract and are not visible to anyone else.
        </p>
      </div>

      {!isOwner && (
        <div className="mt-4 flex items-start gap-3 border border-line-strong bg-cream-200 px-5 py-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <p className="text-sm text-ink-soft">
            You are connected as {shortAddress(address)}, which is not the contract admin. The list
            below is read-only. Connect {owner ? shortAddress(owner) : 'the admin wallet'} to add or
            remove issuers.
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState text="Reading the issuer whitelist" />
      ) : loadError ? (
        <div className="mt-8">
          <EmptyState
            icon={TriangleAlert}
            title="Could not load the issuer list"
            description={loadError}
            action={
              <Button onClick={() => setReloadKey((k) => k + 1)} variant="secondary">
                Try Again
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8">
          <Node
            node={tree.root}
            tier="Contract Admin"
            depth={0}
            expanded={expanded.root}
            onToggle={() => setExpanded((e) => ({ ...e, root: !e.root }))}
            childCount={tree.heads.length + tree.issuers.length}
            isOwner={isOwner}
            ownerAddress={owner}
            onApprove={onApprove}
            onRevokeAccess={onRevokeAccess}
          />

          {expanded.root && (
            <div className="ml-4 border-l border-line pl-6 sm:ml-6 sm:pl-8">
              {tree.heads.map((head) => (
                <Node
                  key={head.address}
                  node={head}
                  tier="Department Head"
                  depth={1}
                  isOwner={isOwner}
                  ownerAddress={owner}
                  onApprove={onApprove}
                  onRevokeAccess={onRevokeAccess}
                />
              ))}

              {tree.issuers.map((issuer) => (
                <Node
                  key={issuer.address}
                  node={issuer}
                  tier="Authorized Issuer"
                  depth={1}
                  isOwner={isOwner}
                  ownerAddress={owner}
                  onApprove={onApprove}
                  onRevokeAccess={onRevokeAccess}
                />
              ))}

              {tree.heads.length === 0 && tree.issuers.length === 0 && (
                <div className="mt-4 border border-dashed border-line-strong bg-cream-50 px-5 py-8 text-center">
                  <Users className="mx-auto h-5 w-5 text-ink-muted" aria-hidden="true" />
                  <p className="mt-3 font-serif text-lg font-semibold text-ink">
                    No issuers whitelisted yet
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
                    Add a wallet and it will be able to mint credentials straight away.
                  </p>
                  {isOwner && (
                    <Button variant="gold" onClick={() => setAddOpen(true)} className="mt-5">
                      Add the first issuer
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddIssuerModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} />

      <TransactionModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        stage={stage}
        stages={REVOKE_STAGES.map((st) =>
          st.id === 'done' ? { id: 'done', label: 'Whitelist updated' } : st
        )}
        result={txResult}
        error={txError}
        title={txTitle}
        successTitle="Whitelist Updated"
        successMessage="The change is on-chain and takes effect immediately."
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

function Node({
  node,
  tier,
  depth,
  expanded,
  onToggle,
  childCount,
  isOwner,
  ownerAddress,
  onApprove,
  onRevokeAccess,
}) {
  if (!node || !node.address) return null

  const isRoot = depth === 0
  const isContractOwner =
    ownerAddress && node.address.toLowerCase() === ownerAddress.toLowerCase()

  return (
    <div className={isRoot ? '' : 'mt-4 first:mt-0'}>
      <article
        className={
          'card p-5 ' + (isRoot ? 'border-navy' : node.active ? '' : 'border-line opacity-80')
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  'inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] ' +
                  (isRoot
                    ? 'bg-navy text-cream-50'
                    : 'border border-line-strong bg-cream-50 text-ink-soft')
                }
              >
                {tier}
              </span>
              {node.active ? (
                <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-verified-500">
                  <CircleCheck className="h-3 w-3" aria-hidden="true" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 border border-revoked-100 bg-revoked-50 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-revoked-600">
                  <CircleSlash className="h-3 w-3" aria-hidden="true" />
                  Access revoked
                </span>
              )}
            </div>

            <h3 className="mt-3 font-serif text-xl font-semibold text-ink">{node.name}</h3>
            {node.department && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                {node.department}
              </p>
            )}

            {HAS_EXPLORER ? (
              <a
                href={explorerAddressUrl(node.address)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block break-all font-mono text-[11px] text-ink-soft hover:text-gold-600"
              >
                {node.address}
              </a>
            ) : (
              <p className="mt-2 break-all font-mono text-[11px] text-ink-soft">{node.address}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!isContractOwner &&
              (node.active ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!isOwner}
                  onClick={() => onRevokeAccess(node)}
                >
                  <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
                  Revoke Access
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isOwner}
                  onClick={() => onApprove(node)}
                >
                  <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve
                </Button>
              ))}

            {isRoot && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-label={expanded ? 'Collapse issuers' : 'Expand issuers'}
                className="inline-flex items-center gap-1.5 border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-navy hover:text-ink"
              >
                {childCount} {childCount === 1 ? 'issuer' : 'issuers'}
                <ChevronDown
                  className={'h-3 w-3 transition-transform ' + (expanded ? 'rotate-180' : '')}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        {isContractOwner && (
          <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Contract owner, cannot be removed from the frontend
          </p>
        )}
      </article>
    </div>
  )
}
