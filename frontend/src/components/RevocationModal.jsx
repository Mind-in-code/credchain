import { useEffect, useState } from 'react'
import { Ban, TriangleAlert } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { displayTokenId, shortAddress } from '../utils/format'

// The reason is a local record only. The contract's revokeCertificate takes a
// token ID and nothing else, so this never reaches the chain.
export const REVOCATION_REASONS = [
  'Fraudulent credential',
  'Incorrect information',
  'Administrative correction',
  'Other',
]

export default function RevocationModal({ open, certificate, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open, certificate])

  if (!certificate) return null

  const submit = () => {
    if (!reason) {
      setError('Pick a reason before revoking.')
      return
    }
    onConfirm(certificate, reason)
  }

  return (
    <Modal open={open} onClose={onClose} title="Revoke Credential?" size="lg">
      <div className="flex items-start gap-3 border border-revoked-100 bg-revoked-50 px-4 py-3.5">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-revoked-500" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink-soft">
          Revoking this credential will permanently mark it as invalid on-chain. The certificate
          will remain in the recipient's wallet but will no longer be considered valid.
        </p>
      </div>

      <dl className="mt-5 divide-y divide-line border border-line">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="label">Token ID</dt>
          <dd className="font-mono text-sm font-semibold text-gold-600">
            {displayTokenId(certificate.tokenId)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="label">Recipient</dt>
          <dd className="text-right">
            <span className="block text-sm font-medium text-ink">
              {certificate.student || 'Unknown'}
            </span>
            <span className="block font-mono text-[10px] text-ink-muted">
              {shortAddress(certificate.owner)}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="label">Credential</dt>
          <dd className="text-sm text-ink">{certificate.course || 'Unknown'}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <Input
          as="select"
          label="Reason for revocation (required)"
          name="revocationReason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError('')
          }}
          error={error}
          hint="Kept as a local record for this session. The contract stores only the revoked flag."
        >
          <option value="">Select a reason</option>
          {REVOCATION_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Input>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="danger" onClick={submit} className="flex-1">
          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
          Confirm Revocation
        </Button>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
