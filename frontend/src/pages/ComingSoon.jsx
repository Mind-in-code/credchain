import { FileClock } from 'lucide-react'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

// Placeholder so Phase A links do not dead end. The real page is Phase B.
export default function ComingSoon() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={FileClock}
        title="Full registry is next"
        description="The complete credentials registry, with sorting and the revoke flow, is built in Phase B. The dashboard already lists every credential this wallet has issued."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button to="/issuer">Back to Dashboard</Button>
            <Button to="/issuer/issue" variant="secondary">
              Issue a Credential
            </Button>
          </div>
        }
      />
    </div>
  )
}
