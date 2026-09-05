import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Fuel,
  Sparkles,
  UploadCloud,
  Wallet,
} from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import CertificateCard from '../components/CertificateCard'
import EmptyState from '../components/EmptyState'
import WalletModal from '../components/WalletModal'
import TransactionModal from '../components/TransactionModal'
import { MINT_STAGES } from '../components/TransactionProgress'
import { useToast } from '../components/Toast'
import { useWallet } from '../hooks/useWallet'
import { mintCertificate } from '../services/credentialService'
import { buildMetadata } from '../utils/metadata'
import { getIssuerByAddress } from '../data/mockIssuers'
import { isValidAddress, todayISO, NETWORK_NAME } from '../utils/format'

const STEPS = [
  { id: 1, title: 'Recipient' },
  { id: 2, title: 'Credential' },
  { id: 3, title: 'Preview' },
  { id: 4, title: 'Confirm' },
]

const EMPTY_FORM = {
  student: '',
  wallet: '',
  studentId: '',
  title: 'Certificate of Achievement',
  course: '',
  institution: '',
  grade: '',
  date: todayISO(),
  expiry: '',
  description: '',
  skills: '',
}

export default function IssueCredential() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isConnected, address, connect } = useWallet()

  const issuerProfile = getIssuerByAddress(address)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    institution: issuerProfile ? issuerProfile.institution : 'Tech University',
  })
  const [errors, setErrors] = useState({})
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)

  const [txOpen, setTxOpen] = useState(false)
  const [stage, setStage] = useState(null)
  const [txResult, setTxResult] = useState(null)
  const [txError, setTxError] = useState('')

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const metadata = useMemo(() => buildMetadata(form), [form])

  const previewCertificate = {
    tokenId: 'preview',
    student: form.student || 'Student Name',
    course: form.course || 'Course or Programme',
    institution: form.institution || 'Institution',
    grade: form.grade || '-',
    date: form.date,
    revoked: false,
    txHash: '',
  }

  const validateStep = (which) => {
    const next = {}
    if (which === 1) {
      if (!form.student.trim()) next.student = 'Enter the student name.'
      if (!form.wallet.trim()) next.wallet = 'Enter the student wallet address.'
      else if (!isValidAddress(form.wallet))
        next.wallet = 'Enter a valid address: 0x followed by 40 hex characters.'
      if (!form.studentId.trim()) next.studentId = 'Enter the student ID.'
    }
    if (which === 2) {
      if (!form.title.trim()) next.title = 'Enter a credential title.'
      if (!form.course.trim()) next.course = 'Enter the course or programme.'
      if (!form.institution.trim()) next.institution = 'Enter the institution.'
      if (!form.grade.trim()) next.grade = 'Enter the grade.'
      if (!form.date) next.date = 'Pick an issue date.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, 4))
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const onMint = async () => {
    setTxError('')
    setTxResult(null)
    setStage('preparing')
    setTxOpen(true)
    try {
      const result = await mintCertificate({ to: form.wallet, metadata }, setStage)
      setTxResult(result)
      toast('Credential minted')
      if (result.storedInline) {
        toast('Pinata key missing, metadata stored inline', 'warning')
      }
    } catch (err) {
      setStage('error')
      setTxError(err.message || 'The transaction failed.')
    }
  }

  const issueAnother = () => {
    setTxOpen(false)
    setStage(null)
    setTxResult(null)
    setStep(1)
    setForm({
      ...EMPTY_FORM,
      institution: issuerProfile ? issuerProfile.institution : form.institution,
    })
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to issue a credential"
          description="Minting writes to the blockchain, so it needs a whitelisted issuer wallet."
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        type="button"
        onClick={() => navigate('/issuer')}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to dashboard
      </button>

      <p className="label-gold mt-6">Issuer Registry / New Credential</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink">
        Issue a Credential
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        The credential is minted straight into the student wallet as an ERC-721 soulbound token. It
        can never be transferred, only revoked.
      </p>

      <StepIndicator step={step} />

      <div className="card mt-8 p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <SectionHeading
              title="Who is this for?"
              subtitle="The credential is minted straight into this wallet and stays there permanently."
            />
            <Input
              label="Student name"
              name="student"
              value={form.student}
              onChange={set('student')}
              placeholder="Aarav Sharma"
              error={errors.student}
            />
            <Input
              label="Student wallet address"
              name="wallet"
              value={form.wallet}
              onChange={set('wallet')}
              placeholder="0x3fD25B8c14E7a90D6b3F82Ce105A47dB9E60F2C1"
              error={errors.wallet}
              hint="Must be 0x followed by 40 hex characters."
              className="font-mono"
            />
            <Input
              label="Student ID"
              name="studentId"
              value={form.studentId}
              onChange={set('studentId')}
              placeholder="TU2022CS104"
              error={errors.studentId}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionHeading
              title="Credential details"
              subtitle="These fields are pinned to IPFS and stored against the token."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Credential title"
                name="title"
                value={form.title}
                onChange={set('title')}
                placeholder="Certificate of Achievement"
                error={errors.title}
              />
              <Input
                label="Course or programme"
                name="course"
                value={form.course}
                onChange={set('course')}
                placeholder="Full Stack Web Development"
                error={errors.course}
              />
              <Input
                label="Institution"
                name="institution"
                value={form.institution}
                onChange={set('institution')}
                error={errors.institution}
                hint="Prefilled from your issuer profile."
              />
              <Input
                label="Grade"
                name="grade"
                value={form.grade}
                onChange={set('grade')}
                placeholder="A+"
                error={errors.grade}
              />
              <Input
                label="Issue date"
                name="date"
                type="date"
                value={form.date}
                onChange={set('date')}
                error={errors.date}
              />
              <Input
                label="Expiry date"
                name="expiry"
                type="date"
                value={form.expiry}
                onChange={set('expiry')}
                hint="Optional. Leave blank if it never expires."
              />
            </div>
            <Input
              label="Description"
              name="description"
              as="textarea"
              value={form.description}
              onChange={set('description')}
              placeholder="Twelve week intensive programme covering modern full stack engineering."
            />
            <Input
              label="Skills"
              name="skills"
              value={form.skills}
              onChange={set('skills')}
              placeholder="React, Node.js, Solidity"
              hint="Comma separated."
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionHeading
              title="Preview"
              subtitle="This is exactly what the student and any verifier will see."
            />
            <div className="mt-6 border border-line bg-cream-200/50 p-3">
              <CertificateCard certificate={previewCertificate} size="lg" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <SectionHeading
              title="Confirm and mint"
              subtitle="Check the details. Minting cannot be undone, it can only be revoked later."
            />

            <dl className="mt-5 divide-y divide-line border border-line">
              <SummaryRow label="Recipient wallet">
                <span className="break-all font-mono text-[11px] text-ink">{form.wallet}</span>
              </SummaryRow>
              <SummaryRow label="Credential">
                <span className="text-sm font-medium text-ink">
                  {form.course} ({form.grade})
                </span>
              </SummaryRow>
              <SummaryRow label="IPFS status">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink">
                  <UploadCloud className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                  Will upload on mint
                </span>
              </SummaryRow>
              <SummaryRow label="Network">
                <span className="font-mono text-[11px] text-ink">{NETWORK_NAME}</span>
              </SummaryRow>
              <SummaryRow label="Estimated gas">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink">
                  <Fuel className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                  ~0.0012 ETH (demo)
                </span>
              </SummaryRow>
            </dl>

            <div className="mt-4 overflow-hidden border border-line">
              <button
                type="button"
                onClick={() => setJsonOpen((v) => !v)}
                aria-expanded={jsonOpen}
                className="flex w-full items-center justify-between px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft hover:bg-cream-50"
              >
                Metadata JSON preview
                <ChevronDown
                  className={'h-3.5 w-3.5 text-ink-muted transition-transform ' + (jsonOpen ? 'rotate-180' : '')}
                  aria-hidden="true"
                />
              </button>
              {jsonOpen && (
                <pre className="max-h-72 overflow-auto border-t border-line bg-navy p-4 font-mono text-[10px] leading-relaxed text-cream-100">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <Button variant="secondary" onClick={goBack} disabled={step === 1}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={goNext}>
              Continue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="gold" onClick={onMint}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Mint Credential
            </Button>
          )}
        </div>
      </div>

      <TransactionModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        stage={stage}
        stages={MINT_STAGES}
        result={txResult}
        error={txError}
        recipient={form.wallet}
        actions={
          txResult ? (
            <>
              <Button to={'/verify/' + txResult.tokenId} className="flex-1">
                View Certificate
              </Button>
              <Button variant="secondary" onClick={issueAnother} className="flex-1">
                Issue Another
              </Button>
            </>
          ) : null
        }
      />
    </div>
  )
}

function StepIndicator({ step }) {
  return (
    <ol className="mt-8 flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = step > s.id
        const active = step === s.id
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-semibold transition-colors ' +
                  (done
                    ? 'border-navy bg-navy text-cream-50'
                    : active
                      ? 'border-gold-500 bg-gold-50 text-gold-700'
                      : 'border-line-strong bg-white text-ink-muted')
                }
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : s.id}
              </span>
              <span
                className={
                  'hidden font-mono text-[10px] font-medium uppercase tracking-[0.12em] sm:block ' +
                  (active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-muted')
                }
              >
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={
                  'h-px flex-1 ' + (done ? 'bg-navy' : 'bg-line-strong')
                }
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
    </div>
  )
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="label">{label}</dt>
      <dd className="min-w-0 sm:text-right">{children}</dd>
    </div>
  )
}
