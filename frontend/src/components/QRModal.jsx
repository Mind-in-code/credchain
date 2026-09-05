import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Download } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { useToast } from './Toast'
import { copyToClipboard, displayTokenId } from '../utils/format'

// Simple inline QR for Phase B. The richer version is Phase C.
export default function QRModal({ open, onClose, certificate }) {
  const { toast } = useToast()
  const qrRef = useRef(null)

  if (!certificate) return null

  const verifyUrl = window.location.origin + '/verify/' + certificate.tokenId

  const copyLink = async () => {
    const ok = await copyToClipboard(verifyUrl)
    toast(ok ? 'Verification link copied' : 'Could not copy link', ok ? 'success' : 'error')
  }

  const download = () => {
    const canvas = qrRef.current && qrRef.current.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'credchain-' + certificate.tokenId + '.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast('QR code downloaded')
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate Verification QR" size="md">
      <div className="flex flex-col items-center">
        <div ref={qrRef} className="border border-line bg-white p-4">
          <QRCodeCanvas value={verifyUrl} size={220} level="M" includeMargin />
        </div>

        <p className="mt-4 font-mono text-sm font-semibold text-gold-600">
          Credential {displayTokenId(certificate.tokenId)}
        </p>
        <p className="mt-2 break-all text-center font-mono text-[11px] text-ink-soft">
          {verifyUrl}
        </p>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Anyone who scans this can verify the credential. No wallet needed.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={copyLink} className="flex-1">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy Link
        </Button>
        <Button variant="primary" onClick={download} className="flex-1">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download PNG
        </Button>
      </div>
    </Modal>
  )
}
