import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, CircleSlash, GraduationCap, ScrollText, Wallet } from 'lucide-react'
import Button from '../components/Button'
import StatCard from '../components/StatCard'
import CertificateCard from '../components/CertificateCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import WalletModal from '../components/WalletModal'
import { useWallet } from '../hooks/useWallet'
import { getCertificate, getCertificatesOf } from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import { shortAddress } from '../utils/format'

export default function StudentDashboard() {
  const { isConnected, address, connect } = useWallet()
  const [loading, setLoading] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setCertificates([])
      return undefined
    }

    let active = true
    setLoading(true)

    async function load() {
      const ids = await getCertificatesOf(address)
      const certs = await Promise.all(ids.map((id) => getCertificate(id)))
      if (!active) return
      setCertificates(certs.filter(Boolean).map(certificateView))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={Wallet}
          title="Connect your wallet to see your credentials"
          description="Your credentials live in your wallet. Connect it to view them. Anyone verifying a credential you share does not need a wallet at all."
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

  const total = certificates.length
  const revoked = certificates.filter((c) => c.revoked).length
  const verified = total - revoked

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="label-gold">Credential Holder / Wallet View</p>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">
            My Credentials
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Every credential minted into this wallet. They are soulbound, so they stay here
            permanently and cannot be transferred away.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip">Wallet: {shortAddress(address)}</span>
            <span className="chip">Non-transferable</span>
          </div>
        </div>

        <Button to="/verify" variant="secondary" className="shrink-0">
          Verify a Credential
        </Button>
      </div>

      {loading ? (
        <LoadingState text="Reading your credentials from the chain" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total" value={total} icon={ScrollText} hint="Held in this wallet" />
            <StatCard
              label="Verified"
              value={verified}
              icon={CircleCheck}
              tone="verified"
              hint="Valid and not revoked"
            />
            <StatCard
              label="Revoked"
              value={revoked}
              icon={CircleSlash}
              tone="revoked"
              hint="Marked invalid by the issuer"
            />
          </div>

          <div className="mt-10">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Credential wallet
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Select a credential to see its full record and share it.
            </p>

            {certificates.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={GraduationCap}
                  title="No credentials in this wallet yet"
                  description="When an institution issues you a credential it appears here straight away. Nothing to do on your side."
                  action={
                    <Button to="/verify" variant="secondary">
                      Verify Someone Else's Credential
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {certificates
                  .slice()
                  .sort((a, b) => b.tokenId - a.tokenId)
                  .map((cert) => (
                    <Link
                      key={cert.tokenId}
                      to={'/certificates/' + cert.tokenId}
                      className="block transition-shadow hover:shadow-lift"
                      aria-label={'Open credential ' + cert.tokenId}
                    >
                      <CertificateCard certificate={cert} size="sm" />
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
