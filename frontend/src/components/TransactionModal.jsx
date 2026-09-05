import { CircleCheck, Copy, ExternalLink, TriangleAlert } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import TransactionProgress, { MINT_STAGES } from './TransactionProgress'
import { useToast } from './Toast'
import {
  copyToClipboard,
  displayTokenId,
  explorerTxUrl,
  shortHash,
  NETWORK_NAME,
} from '../utils/format'

// Drives off the stage string that credentialService reports through onProgress.
export default function TransactionModal({
  open,
  onClose,
  stage,
  stages = MINT_STAGES,
  result,
  error,
  recipient,
  title = 'Issuing Credential',
  successTitle = 'Credential Successfully Issued',
  successMessage = 'The credential is on-chain and permanently bound to the recipient wallet.',
  actions,
}) {
  const { toast } = useToast()
  const isDone = stage === 'done' && result
  const isError = stage === 'error' || Boolean(error)

  const copy = async (value, label) => {
    const ok = await copyToClipboard(value)
    toast(ok ? label + ' copied' : 'Could not copy', ok ? 'success' : 'error')
  }

  return (
    <Modal
      open={open}
      onClose={isDone || isError ? onClose : undefined}
      hideClose={!isDone && !isError}
      size="lg"
      title={isDone ? 'Transaction Complete' : isError ? 'Transaction Failed' : title}
      description={
        isDone || isError ? null : 'Keep this window open until the transaction confirms.'
      }
    >
      {isDone ? (
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-verified-500 text-white">
              <CircleCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-serif text-2xl font-semibold text-ink">{successTitle}</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-soft">{successMessage}</p>
          </div>

          <dl className="mt-6 divide-y divide-line border border-line">
            {result.tokenId !== undefined && (
              <Row label="Token ID">
                <span className="font-mono text-sm font-semibold text-gold-600">
                  {displayTokenId(result.tokenId)}
                </span>
              </Row>
            )}
            <Row label="Transaction">
              <button
                type="button"
                onClick={() => copy(result.txHash, 'Transaction hash')}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink hover:text-gold-600"
              >
                {shortHash(result.txHash)}
                <Copy className="h-3 w-3" aria-hidden="true" />
              </button>
            </Row>
            {result.cid && (
              <Row label="IPFS CID">
                <button
                  type="button"
                  onClick={() => copy(result.cid, 'CID')}
                  className="inline-flex max-w-full items-center gap-1.5 font-mono text-[11px] text-ink hover:text-gold-600"
                >
                  <span className="truncate">{result.cid.slice(0, 20)}...</span>
                  <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
                </button>
              </Row>
            )}
            {recipient && (
              <Row label="Recipient">
                <span className="break-all font-mono text-[11px] text-ink">{recipient}</span>
              </Row>
            )}
            <Row label="Network">
              <span className="font-mono text-[11px] text-ink">{NETWORK_NAME}</span>
            </Row>
            <Row label="Standard">
              <span className="font-mono text-[11px] text-ink">ERC-721 Soulbound</span>
            </Row>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {actions}
            <Button variant="secondary" href={explorerTxUrl(result.txHash)} className="flex-1">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              View Transaction
            </Button>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-revoked-500 text-white">
            <TriangleAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-serif text-xl font-semibold text-ink">Transaction failed</h3>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">
            {error || 'The transaction was rejected. Nothing was written to the blockchain.'}
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-6">
            Close
          </Button>
        </div>
      ) : (
        <TransactionProgress stages={stages} current={stage} />
      )}
    </Modal>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="label">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}
