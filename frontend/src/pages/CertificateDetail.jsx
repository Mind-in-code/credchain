import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleCheck,
  CircleSlash,
  Copy,
  ExternalLink,
  FileQuestion,
  QrCode,
  Share2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'
import Button from '../components/Button'
import CertificateCard from '../components/CertificateCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import QRModal from '../components/QRModal'
import { useToast } from '../components/Toast'
import { getCertificate } from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import {
  CONTRACT_ADDRESS,
  HAS_EXPLORER,
  NETWORK_NAME,
  copyToClipboard,
  displayTokenId,
  explorerAddressUrl,
  explorerTxUrl,
  formatDate,
  ipfsGatewayUrl,
  parseTokenId,
  shortAddress,
  shortHash,
} from '../utils/format'

export default function CertificateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    const tokenId = parseTokenId(id)

    if (tokenId === null) {
      setCertificate(null)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setLoadError('')
    getCertificate(tokenId)
      .then((cert) => {
        if (!active) return
        setCertificate(cert ? certificateView(cert) : null)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setCertificate(null)
        setLoadError(err.message || 'Could not reach the blockchain.')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <LoadingState text="Reading the credential from the chain" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={WifiOff}
          title="Could not reach the blockchain"
          description={loadError}
          action={
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          }
        />
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={FileQuestion}
          title="Credential Not Found"
          description={'No credential exists with the ID ' + String(id) + '.'}
          action={
            <Button to="/verify" variant="secondary">
              Try Another ID
            </Button>
          }
        />
      </div>
    )
  }

  const revoked = certificate.revoked
  const verifyUrl = window.location.origin + '/verify/' + certificate.tokenId

  const copyLink = async () => {
    const ok = await copyToClipboard(verifyUrl)
    toast(ok ? 'Verification link copied' : 'Could not copy link', ok ? 'success' : 'error')
  }

  const share = async () => {
    const payload = {
      title: 'CredChain credential ' + displayTokenId(certificate.tokenId),
      text: certificate.student
        ? certificate.student + ' - ' + certificate.course
        : 'Verify this credential on CredChain',
      url: verifyUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(payload)
        return
      } catch (err) {
        // The person cancelled the share sheet, or it is not allowed here.
        if (err && err.name === 'AbortError') return
      }
    }

    const ok = await copyToClipboard(verifyUrl)
    toast(ok ? 'Link copied, sharing is not available here' : 'Could not copy link', ok ? 'info' : 'error')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </button>

      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label-gold">Credential Record</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">
            {certificate.course || 'Credential'}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {certificate.student || 'Unknown holder'}
            <span className="mx-2 text-line-strong">|</span>
            {certificate.institution || 'Unknown institution'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip">Token {displayTokenId(certificate.tokenId)}</span>
            {revoked ? (
              <span className="inline-flex items-center gap-1.5 border border-revoked-100 bg-revoked-50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-revoked-600">
                <CircleSlash className="h-3 w-3" aria-hidden="true" />
                Revoked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 border border-verified-100 bg-verified-50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-verified-500">
                <CircleCheck className="h-3 w-3" aria-hidden="true" />
                Valid
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Verification Link
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Generate QR
          </Button>
          <Button variant="primary" size="sm" onClick={share}>
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share
          </Button>
        </div>
      </div>

      {certificate.metadataUnavailable && (
        <div className="mt-6 border border-gold-500 bg-gold-50 px-5 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold-700">
            Metadata unavailable
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            The on-chain record is genuine, but the certificate details could not be loaded from
            storage, so some fields below may be blank.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <CertificateCard
          certificate={certificate}
          size="lg"
          onQrClick={() => setQrOpen(true)}
        />

        <div className="space-y-5">
          <Panel title="Credential Details">
            <Row label="Student" value={certificate.student} />
            <Row label="Student ID" value={certificate.studentId} />
            <Row label="Course" value={certificate.course} />
            <Row label="Institution" value={certificate.institution} />
            <Row label="Grade" value={certificate.grade} />
            <Row label="Issue date" value={formatDate(certificate.date)} />
            {certificate.expiry && <Row label="Expires" value={formatDate(certificate.expiry)} />}
            {certificate.skills && <Row label="Skills" value={certificate.skills} />}
            <Row label="Token ID" value={displayTokenId(certificate.tokenId)} mono />
          </Panel>

          <Panel title="Blockchain Proof">
            <Row label="Network" value={NETWORK_NAME} />
            <Row label="Contract" value={shortAddress(CONTRACT_ADDRESS)} mono />
            <Row label="Token ID" value={displayTokenId(certificate.tokenId)} mono />
            <Row
              label="Transaction"
              value={
                HAS_EXPLORER && certificate.txHash ? (
                  <a
                    href={explorerTxUrl(certificate.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink hover:text-gold-600"
                  >
                    {shortHash(certificate.txHash)}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-ink">
                    {shortHash(certificate.txHash) || 'Not available'}
                  </span>
                )
              }
            />
            <Row
              label="Owner"
              value={
                HAS_EXPLORER ? (
                  <a
                    href={explorerAddressUrl(certificate.owner)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink hover:text-gold-600"
                  >
                    {shortAddress(certificate.owner)}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-ink">
                    {shortAddress(certificate.owner)}
                  </span>
                )
              }
            />
            <Row
              label="Status"
              value={
                <span
                  className={
                    'font-mono text-[11px] uppercase tracking-[0.1em] ' +
                    (revoked ? 'text-revoked-600' : 'text-verified-600')
                  }
                >
                  {revoked ? 'Revoked' : 'Valid'} | Soulbound
                </span>
              }
            />
          </Panel>

          <Panel title="IPFS Metadata">
            {certificate.cid ? (
              <>
                <Row label="CID" value={certificate.cid} mono wrap />
                <div className="px-4 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    href={ipfsGatewayUrl(certificate.tokenURI)}
                    className="w-full"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    View Metadata
                  </Button>
                </div>
              </>
            ) : (
              <Row
                label="Storage"
                value="Stored inline in the token URI, no IPFS key was set at mint time"
              />
            )}
          </Panel>

          <Panel title="Verification">
            <div className="flex items-start gap-3 px-4 py-4">
              <ShieldCheck
                className={
                  'mt-0.5 h-4 w-4 shrink-0 ' + (revoked ? 'text-revoked-500' : 'text-verified-500')
                }
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-ink-soft">
                {revoked
                  ? 'This credential was issued by an authorized institution, but that institution has since revoked it. It should not be treated as valid.'
                  : 'Cryptographically verified credential issued by an authorized institution.'}
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} certificate={certificate} />
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="card overflow-hidden">
      <h2 className="bg-navy px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cream-50">
        {title}
      </h2>
      <dl className="divide-y divide-line">{children}</dl>
    </section>
  )
}

function Row({ label, value, mono = false, wrap = false }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="label shrink-0 pt-0.5">{label}</dt>
      <dd
        className={
          'min-w-0 text-right text-sm text-ink ' +
          (mono ? 'font-mono text-[11px] ' : '') +
          (wrap ? 'break-all' : '')
        }
      >
        {value || '-'}
      </dd>
    </div>
  )
}
