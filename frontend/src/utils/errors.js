// Turns contract reverts and wallet errors into something a person can read.

const MESSAGES = [
  { match: 'Not an authorized issuer', text: 'This wallet is not an authorized issuer.' },
  { match: 'Not authorized to revoke', text: 'Only the issuing institution or the admin can revoke this credential.' },
  { match: 'Already revoked', text: 'This credential has already been revoked.' },
  { match: 'Soulbound: transfer not allowed', text: 'This credential is soulbound and cannot be transferred.' },
  { match: 'Nonexistent token', text: 'No credential with that ID.' },
  { match: 'OwnableUnauthorizedAccount', text: 'Only the admin can do this.' },
  { match: 'Zero address', text: 'That wallet address is not valid.' },
  { match: 'insufficient funds', text: 'Not enough test ETH for gas.' },
]

export function friendlyError(error) {
  if (!error) return 'Something went wrong.'

  // The user closed or rejected the MetaMask popup.
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return 'You cancelled the transaction.'
  }

  const haystack = [
    error.reason,
    error.shortMessage,
    error.message,
    error.data && error.data.message,
    error.info && error.info.error && error.info.error.message,
  ]
    .filter(Boolean)
    .join(' | ')

  for (const entry of MESSAGES) {
    if (haystack.includes(entry.match)) return entry.text
  }

  if (haystack.includes('user rejected')) return 'You cancelled the transaction.'
  if (haystack.includes('could not detect network') || haystack.includes('failed to fetch')) {
    return 'Cannot reach the blockchain. Is the local Hardhat node running?'
  }

  return error.shortMessage || error.reason || error.message || 'Something went wrong.'
}

// True when the contract said the token does not exist, so callers can return null.
export function isNonexistentToken(error) {
  if (!error) return false
  const haystack = [error.reason, error.shortMessage, error.message].filter(Boolean).join(' | ')
  return haystack.includes('Nonexistent token')
}
