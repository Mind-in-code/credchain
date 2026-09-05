import { useEffect, useState } from 'react'
import { ShieldPlus } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { isValidAddress } from '../utils/format'

// Only the wallet address reaches the contract. Name, role and department are
// frontend labels, because the contract keeps a flat whitelist with no roles.
export const ISSUER_ROLES = [
  {
    id: 'Super Admin',
    label: 'Super Admin',
    permission: 'Can whitelist and remove other issuers, and revoke any credential.',
  },
  {
    id: 'Department Head',
    label: 'Department Head',
    permission: 'Can issue credentials and revoke the ones their department issued.',
  },
  {
    id: 'Issuer',
    label: 'Issuer',
    permission: 'Can issue credentials and revoke only the ones it issued itself.',
  },
]

const EMPTY = { address: '', name: '', role: 'Issuer', department: '' }

export default function AddIssuerModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const submit = () => {
    const next = {}
    if (!form.address.trim()) next.address = 'Enter the wallet address to whitelist.'
    else if (!isValidAddress(form.address))
      next.address = 'Enter a valid address: 0x followed by 40 hex characters.'
    if (!form.name.trim()) next.name = 'Enter a name for this issuer.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ ...form, address: form.address.trim() })
  }

  const selected = ISSUER_ROLES.find((r) => r.id === form.role) || ISSUER_ROLES[2]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Issuer"
      description="Whitelist a wallet so it can mint credentials."
      size="lg"
    >
      <div className="space-y-5">
        <Input
          label="Wallet address"
          name="address"
          value={form.address}
          onChange={set('address')}
          placeholder="0x..."
          error={errors.address}
          hint="This is the only field written to the contract."
          className="font-mono"
        />

        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={set('name')}
          placeholder="Northbridge University"
          error={errors.name}
        />

        <div>
          <Input as="select" label="Role" name="role" value={form.role} onChange={set('role')}>
            {ISSUER_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Input>
          <p className="mt-2 border border-line bg-cream-50 px-3 py-2 text-xs text-ink-soft">
            {selected.permission}
          </p>
        </div>

        <Input
          label="Department"
          name="department"
          value={form.department}
          onChange={set('department')}
          placeholder="School of Computer Science"
          hint="Optional. A frontend label only."
        />

        <p className="border border-gold-500 bg-gold-50 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          Only the wallet address goes on chain. The name, role and department are stored in this
          browser for the session, because the contract keeps a flat whitelist with no roles.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="gold" onClick={submit} className="flex-1">
          <ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Issuer
        </Button>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
