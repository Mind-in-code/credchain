import { useEffect, useState } from 'react'
import Hero from '../components/landing/Hero'
import ProblemSection from '../components/landing/ProblemSection'
import HowItWorks from '../components/landing/HowItWorks'
import StatsRow from '../components/landing/StatsRow'
import FinalCTA from '../components/landing/FinalCTA'
import { getCertificate, getIssuers, getIssuedBy } from '../services/credentialService'
import { certificateView } from '../utils/certificate'
import { DEMO_MODE } from '../utils/network'
import { mockCertificates } from '../data/mockCertificates'
import { buildMetadata } from '../utils/metadata'

// In demo mode #1284 is the showcase credential. On a real chain we show the
// newest one that exists, and fall back to a sample if the chain is empty.
const DEMO_HERO_TOKEN_ID = 1284

const SAMPLE = certificateView({
  ...mockCertificates[3],
  valid: true,
  metadata: buildMetadata(mockCertificates[3]),
})

export default function Landing() {
  const [heroCert, setHeroCert] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (DEMO_MODE) {
        const cert = await getCertificate(DEMO_HERO_TOKEN_ID)
        if (!active) return
        setHeroCert(cert ? certificateView(cert) : SAMPLE)
        setStats({ issued: 12, issuers: 4, valid: 10, revoked: 2 })
        return
      }

      // Chain mode: read the real registry through the service layer.
      try {
        const issuers = await getIssuers()
        const active_issuers = issuers.filter((i) => i.active)

        const lists = await Promise.all(active_issuers.map((i) => getIssuedBy(i.address)))
        const all = lists.flat()

        if (!active) return

        const newest = all.slice().sort((a, b) => b.tokenId - a.tokenId)[0]
        setHeroCert(newest ? certificateView(newest) : SAMPLE)
        setStats({
          issued: all.length,
          issuers: active_issuers.length,
          valid: all.filter((c) => !c.revoked).length,
          revoked: all.filter((c) => c.revoked).length,
        })
      } catch (err) {
        // The chain may be unreachable. Still render the page.
        if (!active) return
        setHeroCert(SAMPLE)
        setStats({ issued: 0, issuers: 0, valid: 0, revoked: 0 })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Hero certificate={heroCert} stats={stats} />
      <ProblemSection />
      <HowItWorks />
      <StatsRow />
      <FinalCTA />
    </>
  )
}
