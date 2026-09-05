import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import jsQR from 'jsqr'
import {
  CircleCheck,
  CircleSlash,
  Copy,
  Download,
  ExternalLink,
  FileQuestion,
  QrCode,
  ScanLine,
  Search,
  Share2,
  Upload,
  WifiOff,
} from 'lucide-react'
import Button from '../components/Button'
import CertificateCard from '../components/CertificateCard'
import LoadingState from '../components/LoadingState'
import QRModal from '../components/QRModal'
import { useToast } from '../components/Toast'
import { getCertificate, getCertificatesOf } from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import { getIssuerByAddress } from '../data/mockIssuers'
import { DEMO_MODE } from '../utils/network'
import {
  CONTRACT_ADDRESS,
  copyToClipboard,
  displayTokenId,
  explorerAddressUrl,
  explorerTxUrl,
  HAS_EXPLORER,
  formatDate,
  ipfsGatewayUrl,
  isValidAddress,
  parseTokenId,
  shortAddress,
  shortHash,
  NETWORK_NAME,
} from '../utils/format'

const TABS = [
  { id: 'wallet', label: 'Wallet Address' },
  { id: 'id', label: 'Credential ID' },
  { id: 'scan', label: 'Scan QR' },
]

export default function Verify() {
  const { id, address } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [tab, setTab] = useState(address ? 'wallet' : 'id')
  const [query, setQuery] = useState('')
  const [inputError, setInputError] = useState('')
  const [loading, setLoading] = useState(false)
  // result: null | { kind: 'single', certificate } | { kind: 'list', certificates, address }
  //         | { kind: 'notFound', message }
  const [result, setResult] = useState(null)
  // Scan QR tab only: what the last decoded image contained.
  const [scanNotice, setScanNotice] = useState(null)

  const runById = useCallback(async (rawValue) => {
    const tokenId = parseTokenId(rawValue)
    if (tokenId === null) {
      setResult({ kind: 'notFound', message: 'That is not a valid credential ID.' })
      return
    }
    setLoading(true)
    setResult(null)
    let cert
    try {
      cert = await getCertificate(tokenId)
    } catch (err) {
      setLoading(false)
      setResult({ kind: 'chainError', message: err.message || 'Could not reach the blockchain.' })
      return
    }
    setLoading(false)
    if (!cert) {
      setResult({
        kind: 'notFound',
        message: 'No credential exists with the ID ' + displayTokenId(tokenId) + '.',
      })
      return
    }
    setResult({ kind: 'single', certificate: certificateView(cert) })
  }, [])

  const runByWallet = useCallback(async (walletAddress) => {
    setLoading(true)
    setResult(null)
    let certs
    try {
      const tokenIds = await getCertificatesOf(walletAddress)
      certs = await Promise.all(tokenIds.map((t) => getCertificate(t)))
    } catch (err) {
      setLoading(false)
      setResult({ kind: 'chainError', message: err.message || 'Could not reach the blockchain.' })
      return
    }
    setLoading(false)

    const views = certs.filter(Boolean).map(certificateView)
    if (views.length === 0) {
      setResult({
        kind: 'notFound',
        message: 'No credential exists for the wallet ' + shortAddress(walletAddress) + '.',
      })
      return
    }
    if (views.length === 1) {
      setResult({ kind: 'single', certificate: views[0] })
      return
    }
    setResult({ kind: 'list', certificates: views, address: walletAddress })
  }, [])

  // /verify/:id and /verify/wallet/:address run automatically. QR codes point here.
  useEffect(() => {
    setScanNotice(null)
    if (id) {
      setTab('id')
      setQuery(String(id))
      runById(id)
    } else if (address) {
      setTab('wallet')
      setQuery(address)
      runByWallet(address)
    } else {
      setResult(null)
      setQuery('')
    }
  }, [id, address, runById, runByWallet])

  const onSubmit = (e) => {
    e.preventDefault()
    const value = query.trim()
    setInputError('')

    if (!value) {
      setInputError('Enter a value to verify.')
      return
    }

    if (tab === 'wallet') {
      if (!isValidAddress(value)) {
        setInputError('Enter a valid wallet address: 0x followed by 40 characters.')
        return
      }
      navigate('/verify/wallet/' + value)
      return
    }

    const tokenId = parseTokenId(value)
    if (tokenId === null) {
      setInputError('Enter a credential ID like 1284 or #1284.')
      return
    }
    navigate('/verify/' + tokenId)
  }

  // A scanned QR holds a full /verify/<id> URL, but accept a bare id or an
  // address too so a hand-made code still works.
  // The result is looked up in place: the tab does not change and the URL does
  // not move, so another QR can be tried straight away.
  const onScanDecoded = (text) => {
    const value = String(text || '').trim()
    if (!value) return

    setScanNotice(null)

    const idMatch = value.match(/\/verify\/(\d+)/)
    if (idMatch) {
      const tokenId = Number(idMatch[1])
      setScanNotice({ kind: 'id', tokenId })
      runById(tokenId)
      return
    }

    const walletMatch = value.match(/\/verify\/wallet\/(0x[a-fA-F0-9]{40})/)
    if (walletMatch) {
      setScanNotice({ kind: 'wallet', address: walletMatch[1] })
      runByWallet(walletMatch[1])
      return
    }

    if (isValidAddress(value)) {
      setScanNotice({ kind: 'wallet', address: value })
      runByWallet(value)
      return
    }

    const tokenId = parseTokenId(value)
    if (tokenId !== null) {
      setScanNotice({ kind: 'id', tokenId })
      runById(tokenId)
      return
    }

    setScanNotice({
      kind: 'error',
      message: 'That QR code does not point at a CredChain credential.',
    })
  }

  const switchTab = (nextTab) => {
    setTab(nextTab)
    setInputError('')
    setQuery('')
    // The scan notice belongs to the Scan QR tab only.
    if (nextTab !== 'scan') setScanNotice(null)
  }

  return (
    <div className="min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-line">
        <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
          <span className="chip">Public Credential Lookup</span>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Verify a Credential
          </h1>
          <p className="mt-3 max-w-xl text-base text-ink-soft">
            Check any credential straight from the blockchain using a wallet address or a credential
            ID. No wallet and no account needed.
          </p>

          <form onSubmit={onSubmit} className="mt-8 border border-line-strong bg-white p-4">
            <div
              className="mb-3 flex border border-line-strong"
              role="tablist"
              aria-label="Verification method"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => switchTab(t.id)}
                  className={
                    'flex-1 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ' +
                    (tab === t.id
                      ? 'bg-navy text-cream-50'
                      : 'bg-white text-ink-muted hover:text-ink')
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'scan' ? (
              <>
                <ScanPanel onDecoded={onScanDecoded} />
                <ScanNotice notice={scanNotice} result={result} loading={loading} />
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                      aria-hidden="true"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label={tab === 'wallet' ? 'Wallet address' : 'Credential ID'}
                      placeholder={tab === 'wallet' ? '0x3fD2...' : '1284'}
                      className={
                        'h-11 w-full rounded-sm border bg-cream-50 pl-9 pr-3 font-mono text-sm text-ink placeholder:text-ink-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy ' +
                        (inputError ? 'border-revoked-500' : 'border-line-strong')
                      }
                    />
                  </div>
                  <Button type="submit" size="lg" className="sm:w-auto">
                    Verify Credential
                  </Button>
                </div>

                <p
                  className={
                    'mt-3 font-mono text-[10px] uppercase tracking-[0.12em] ' +
                    (inputError ? 'text-revoked-500' : 'text-ink-muted')
                  }
                >
                  {inputError ||
                    (tab === 'wallet'
                      ? DEMO_MODE
                        ? 'Try 0x3fD25B8c14E7a90D6b3F82Ce105A47dB9E60F2C1'
                        : 'Paste the student wallet address'
                      : DEMO_MODE
                        ? 'Try 1284 for a valid record, or 1290 for a revoked one'
                        : 'Enter the credential ID, for example 1')}
                </p>
              </>
            )}
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {loading && <LoadingState text="Reading the blockchain" />}

        {!loading && result && result.kind === 'single' && (
          <SingleResult certificate={result.certificate} toast={toast} />
        )}

        {!loading && result && result.kind === 'list' && (
          <WalletResults certificates={result.certificates} address={result.address} />
        )}

        {!loading && result && result.kind === 'notFound' && (
          <NotFoundResult message={result.message} />
        )}

        {!loading && result && result.kind === 'chainError' && (
          <ChainErrorResult message={result.message} />
        )}
      </div>
    </div>
  )
}

// The strip under the Scan QR panel. Reports what the decoded image contained,
// then the normal result panel renders below it on this same tab.
function ScanNotice({ notice, result, loading }) {
  if (!notice) return null

  if (notice.kind === 'error') {
    return (
      <p className="mt-3 border border-revoked-100 bg-revoked-50 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-revoked-600">
        {notice.message}
      </p>
    )
  }

  const found = !loading && result && (result.kind === 'single' || result.kind === 'list')
  const missing = !loading && result && result.kind === 'notFound'

  const label =
    notice.kind === 'id'
      ? 'Credential ' + displayTokenId(notice.tokenId)
      : 'Wallet ' + shortAddress(notice.address)

  if (loading) {
    return (
      <p className="mt-3 border border-line-strong bg-cream-50 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
        QR decoded, checking {label}
      </p>
    )
  }

  if (missing) {
    return (
      <p className="mt-3 border border-gold-500 bg-gold-50 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gold-700">
        QR decoded, but no credential exists for {label}
      </p>
    )
  }

  if (!found) return null

  return (
    <p className="mt-3 flex items-center gap-2 border border-verified-500 bg-verified-50 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-verified-600">
      <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {notice.kind === 'id'
        ? 'QR decoded, credential ' + displayTokenId(notice.tokenId) + ' found'
        : 'QR decoded, ' + label + ' found'}
    </p>
  )
}

// Camera scanning is not implemented, but an uploaded QR image is decoded for
// real with jsQR, so a screenshot or a photo of a certificate works.
function ScanPanel({ onDecoded }) {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  const readFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('error')
      setMessage('That file is not an image.')
      return
    }

    setStatus('reading')
    setMessage('Reading the image')

    const reader = new FileReader()
    reader.onerror = () => {
      setStatus('error')
      setMessage('Could not read that file.')
    }
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => {
        setStatus('error')
        setMessage('Could not open that image.')
      }
      img.onload = () => {
        // Cap the work on very large photos.
        const scale = Math.min(1, 1400 / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, w, h)

        const data = ctx.getImageData(0, 0, w, h)
        const found = jsQR(data.data, w, h, { inversionAttempts: 'attemptBoth' })

        if (found && found.data) {
          // ScanNotice below reports what was found, so clear this line.
          setStatus('idle')
          setMessage('')
          onDecoded(found.data)
        } else {
          setStatus('error')
          setMessage('No QR code found in that image. Try a sharper or larger crop.')
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="flex flex-col items-center border border-dashed border-line-strong bg-cream-50 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-line-strong bg-white text-ink-muted">
          <ScanLine className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
          Camera preview
        </p>
        <p className="mt-2 max-w-sm text-xs text-ink-muted">
          Camera scanning available in the mobile build. You can still upload a photo or a
          screenshot of a certificate and it will be decoded here.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            readFile(e.target.files && e.target.files[0])
            e.target.value = ''
          }}
        />

        <Button
          type="button"
          variant="primary"
          className="mt-5"
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Upload QR Image
        </Button>
      </div>

      {message && (
        <p
          className={
            'mt-3 font-mono text-[10px] uppercase tracking-[0.12em] ' +
            (status === 'error'
              ? 'text-revoked-500'
              : status === 'done'
                ? 'text-verified-500'
                : 'text-ink-muted')
          }
        >
          {message}
        </p>
      )}
    </div>
  )
}

function SingleResult({ certificate, toast }) {
  const qrRef = useRef(null)
  const [qrOpen, setQrOpen] = useState(false)
  const revoked = certificate.revoked
  const verifyUrl = window.location.origin + '/verify/' + certificate.tokenId
  const issuerProfile = getIssuerByAddress(certificate.issuer)

  const copyLink = async () => {
    const ok = await copyToClipboard(verifyUrl)
    toast(ok ? 'Verification link copied' : 'Could not copy link', ok ? 'success' : 'error')
  }

  const downloadQr = () => {
    const canvas = qrRef.current && qrRef.current.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'credchain-' + certificate.tokenId + '.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast('QR code downloaded')
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Result band */}
      <div
        className={
          'border ' +
          (revoked
            ? 'border-revoked-500 bg-revoked-50'
            : 'border-verified-500 bg-verified-50')
        }
      >
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span
              className={
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ' +
                (revoked ? 'bg-revoked-500 text-white' : 'bg-verified-500 text-white')
              }
            >
              {revoked ? (
                <CircleSlash className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CircleCheck className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <h2
                className={
                  'font-serif text-xl font-semibold uppercase tracking-[0.06em] sm:text-2xl ' +
                  (revoked ? 'text-revoked-600' : 'text-verified-600')
                }
              >
                {revoked
                  ? 'Credential Revoked by Issuer'
                  : 'Credential Verified and On-Chain Authentic'}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-soft">
                {revoked
                  ? 'This credential exists on-chain but the issuing institution has revoked it. It should not be treated as valid.'
                  : 'This credential was issued by a whitelisted institution wallet and has not been revoked.'}
              </p>
              <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                Issued {formatDate(certificate.date)}
                <span className="mx-2 text-line-strong">|</span>
                Token {displayTokenId(certificate.tokenId)}
                <span className="mx-2 text-line-strong">|</span>
                {NETWORK_NAME}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={copyLink}>
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Copy Verification Link
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
              Generate QR
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadQr}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download QR
            </Button>
          </div>
        </div>
      </div>

      {certificate.metadataUnavailable && (
        <div className="border border-gold-500 bg-gold-50 px-5 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold-700">
            Metadata unavailable
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            The on-chain record is genuine, but the certificate details could not be loaded from
            storage. Names and course fields may be blank below.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="label mb-3">Certificate Record</p>
          <CertificateCard
            certificate={certificate}
            size="lg"
            onQrClick={() => setQrOpen(true)}
          />
        </div>

        <div>
          <p className="label mb-3">Verification Record</p>
          <div className="border border-line bg-white">
            <div className="flex items-center justify-between gap-3 bg-navy px-4 py-3">
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-cream-50">
                On-Chain Record
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold-500">
                {NETWORK_NAME}
              </span>
            </div>

            <dl className="divide-y divide-line">
              <RecordRow label="Issuing Authority">
                <p className="font-sans text-sm font-semibold text-ink">
                  {certificate.institution}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center justify-end gap-2">
                  <span className="font-mono text-[11px] text-ink-soft">
                    {shortAddress(certificate.issuer)}
                  </span>
                  <span className="inline-flex items-center gap-1 border border-verified-100 bg-verified-50 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-verified-500">
                    Whitelisted Issuer
                  </span>
                </div>
                {issuerProfile && (
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                    {issuerProfile.department}
                  </p>
                )}
              </RecordRow>

              <RecordRow label="Recipient Wallet">
                <p className="font-sans text-sm font-semibold text-ink">{certificate.student}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-ink-soft">
                  {certificate.owner}
                </p>
              </RecordRow>

              <RecordRow label="Standard">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink">
                  ERC-721 Soulbound
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                  Transfers permanently disabled
                </p>
              </RecordRow>

              <RecordRow label="Contract Address">
                {HAS_EXPLORER ? (
                  <a
                    href={explorerAddressUrl(CONTRACT_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 break-all font-mono text-[11px] text-ink hover:text-gold-600"
                  >
                    {CONTRACT_ADDRESS}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="break-all font-mono text-[11px] text-ink">{CONTRACT_ADDRESS}</p>
                )}
              </RecordRow>

              <RecordRow label="Token ID">
                <p className="font-mono text-sm font-semibold text-ink">
                  {displayTokenId(certificate.tokenId)}
                </p>
              </RecordRow>

              <RecordRow label="Revocation Status">
                {revoked ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 border border-revoked-500 bg-revoked-50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-revoked-600">
                      <CircleSlash className="h-3 w-3" aria-hidden="true" />
                      Revoked
                    </span>
                    {certificate.revokedReason && (
                      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-revoked-500">
                        Reason: {certificate.revokedReason}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border border-verified-500 bg-verified-50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-verified-600">
                    <CircleCheck className="h-3 w-3" aria-hidden="true" />
                    Not Revoked
                  </span>
                )}
              </RecordRow>

              <RecordRow label="Metadata">
                {certificate.cid ? (
                  <>
                    <a
                      href={ipfsGatewayUrl(certificate.tokenURI)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 break-all font-mono text-[11px] text-ink hover:text-gold-600"
                    >
                      {certificate.cid}
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                      Course, grade and date pinned to IPFS
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] text-ink">Stored inline on-chain</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                      No IPFS key set, metadata is in the token URI
                    </p>
                  </>
                )}
              </RecordRow>

              <RecordRow label="Transaction Hash">
                {HAS_EXPLORER ? (
                  <>
                    <a
                      href={explorerTxUrl(certificate.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink hover:text-gold-600"
                    >
                      {shortHash(certificate.txHash)}
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">
                      View on Etherscan
                    </p>
                  </>
                ) : (
                  <p className="break-all font-mono text-[11px] text-ink">
                    {shortHash(certificate.txHash) || 'Not available'}
                  </p>
                )}
              </RecordRow>
            </dl>

            <div className="border-t border-line bg-cream-50 px-4 py-3.5">
              <p className="text-xs leading-relaxed text-ink-soft">
                This record was read from the CredChain contract on {NETWORK_NAME}. Anyone can repeat
                this check with the credential ID or the QR code on the certificate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas, used only to produce the PNG download. */}
      <div ref={qrRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas value={verifyUrl} size={512} level="M" includeMargin />
      </div>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} certificate={certificate} />
    </div>
  )
}

function RecordRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="label shrink-0 pt-0.5">{label}</dt>
      <dd className="min-w-0 sm:max-w-[62%] sm:text-right">{children}</dd>
    </div>
  )
}

function WalletResults({ certificates, address }) {
  const valid = certificates.filter((c) => !c.revoked).length

  return (
    <div className="animate-fade-in">
      <div className="border border-line bg-white p-5 sm:p-6">
        <p className="label">Wallet Lookup</p>
        <h2 className="mt-2.5 font-serif text-2xl font-semibold tracking-tight text-ink">
          {certificates.length} credentials found
        </h2>
        <p className="mt-2 break-all font-mono text-[11px] text-ink-soft">{address}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          {valid} valid
          <span className="mx-2 text-line-strong">|</span>
          {certificates.length - valid} revoked
          <span className="mx-2 text-line-strong">|</span>
          Select a record for full details
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {certificates.map((cert) => (
          <Link
            key={cert.tokenId}
            to={'/verify/' + cert.tokenId}
            className="block transition-shadow hover:shadow-lift"
          >
            <CertificateCard certificate={cert} size="sm" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function ChainErrorResult({ message }) {
  return (
    <div className="card mx-auto max-w-2xl animate-fade-in px-6 py-16 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-sm border border-revoked-100 bg-revoked-50 text-revoked-500">
        <WifiOff className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-ink">
        Could not reach the blockchain
      </h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm text-ink-soft">{message}</p>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        The credential may still be fine. This is a connection problem, not a verification failure.
      </p>
    </div>
  )
}

function NotFoundResult({ message }) {
  return (
    <div className="card mx-auto max-w-2xl animate-fade-in px-6 py-16 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-sm border border-line-strong bg-cream-50 text-ink-soft">
        <FileQuestion className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-ink">Credential Not Found</h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm text-ink-soft">{message}</p>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        Check the ID or wallet address and try again
      </p>
    </div>
  )
}
