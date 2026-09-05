import { useEffect, useState } from 'react'
import Hero from '../components/landing/Hero'
import ProblemSection from '../components/landing/ProblemSection'
import HowItWorks from '../components/landing/HowItWorks'
import StatsRow from '../components/landing/StatsRow'
import FinalCTA from '../components/landing/FinalCTA'
import { getCertificate } from '../services/credentialService'
import { certificateView } from '../utils/certificate'

// #1284 is the showcase credential used in the hero.
const HERO_TOKEN_ID = 1284

export default function Landing() {
  const [heroCert, setHeroCert] = useState(null)

  useEffect(() => {
    let active = true
    getCertificate(HERO_TOKEN_ID).then((cert) => {
      if (active) setHeroCert(certificateView(cert))
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Hero certificate={heroCert} />
      <ProblemSection />
      <HowItWorks />
      <StatsRow />
      <FinalCTA />
    </>
  )
}
