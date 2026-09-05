import { Landmark } from 'lucide-react'
import Button from '../Button'

export default function FinalCTA() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="chip">
                <Landmark className="h-3 w-3" aria-hidden="true" />
                For Institutions
              </span>
              <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                Ready to make your credentials verifiable?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The contract admin whitelists your institution wallet. After that you can mint
                credentials straight into student wallets and revoke them if you ever need to.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:shrink-0">
              <Button to="/issuer/issue" variant="primary" size="lg">
                Issue a Credential
              </Button>
              <Button to="/verify" variant="secondary" size="lg">
                Verify a Credential
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
