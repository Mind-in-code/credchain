import { useState } from 'react'
import { ChevronDown, Link2Off, ShieldCheck, FileJson, QrCode } from 'lucide-react'

const STEPS = [
  {
    number: 'Pillar 01',
    title: 'Issuer Whitelist',
    icon: ShieldCheck,
    summary: 'Only approved institution wallets can issue credentials.',
    detail:
      'The contract admin adds an institution wallet to an on-chain whitelist. Any wallet that is not on the list is rejected by the contract, so a random address can never mint a credential in a university name.',
    footLabel: 'Access',
    footValue: 'Admin controlled',
  },
  {
    number: 'Pillar 02',
    title: 'Soulbound Minting',
    icon: Link2Off,
    summary: 'The credential is minted into the student wallet and cannot be moved.',
    detail:
      'Each credential is an ERC-721 token with transfers disabled. It stays in the wallet it was minted to forever, so credentials cannot be sold, lent or handed to someone else.',
    footLabel: 'Standard',
    footValue: 'ERC-721 Soulbound',
  },
  {
    number: 'Pillar 03',
    title: 'IPFS Metadata',
    icon: FileJson,
    summary: 'Certificate details live on IPFS, addressed by content hash.',
    detail:
      'Student name, course, grade and date are pinned to IPFS. The token stores the content hash, so if a single character of the certificate changed the hash would no longer match.',
    footLabel: 'Storage',
    footValue: 'Content addressed',
  },
  {
    number: 'Pillar 04',
    title: 'Instant Verification',
    icon: QrCode,
    summary: 'Anyone can verify from a credential ID, a wallet address or a QR code.',
    detail:
      'An employer opens the verify page or scans the QR code printed on the certificate, and reads the result straight from the blockchain: who issued it, when, and whether the issuer has revoked it.',
    footLabel: 'Access',
    footValue: 'Public, no wallet',
  },
]

export default function HowItWorks() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="label-gold">How It Works</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Four pillars of verifiable academic trust
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Select a pillar to expand
          </span>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, index) => {
            const open = openIndex === index
            const Icon = step.icon
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                aria-expanded={open}
                className={
                  'card flex flex-col p-5 text-left transition-colors hover:border-line-strong ' +
                  (open ? 'border-gold-500' : '')
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="label-gold">{step.number}</span>
                  <Icon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                </div>

                <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{step.summary}</p>

                {open && (
                  <p className="mt-4 animate-fade-in border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
                    {step.detail}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="label">
                    {step.footLabel}: <span className="text-ink-soft">{step.footValue}</span>
                  </span>
                  <ChevronDown
                    className={
                      'h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ' +
                      (open ? 'rotate-180' : '')
                    }
                    aria-hidden="true"
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
