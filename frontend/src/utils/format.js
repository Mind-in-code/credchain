// Small formatting helpers used across the app.

export const EXPLORER_URL = 'https://sepolia.etherscan.io'
export const NETWORK_NAME = 'Sepolia Testnet'
export const CHAIN_ID = 11155111

export function shortAddress(address, lead = 6, tail = 4) {
  if (!address) return ''
  if (address.length <= lead + tail + 2) return address
  return address.slice(0, lead) + '...' + address.slice(-tail)
}

export function shortHash(hash) {
  return shortAddress(hash, 10, 8)
}

export function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test((value || '').trim())
}

// Accepts "1284" or "#1284" or "CC-1284" and returns the number, or null.
export function parseTokenId(value) {
  if (value === null || value === undefined) return null
  const cleaned = String(value).trim().replace(/^#/, '').replace(/^CC-/i, '')
  if (!/^\d+$/.test(cleaned)) return null
  return Number(cleaned)
}

export function displayTokenId(tokenId) {
  return '#' + tokenId
}

export function formatDate(value) {
  if (!value) return ''
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return now.getFullYear() + '-' + month + '-' + day
}

export function explorerTxUrl(txHash) {
  return EXPLORER_URL + '/tx/' + txHash
}

export function explorerAddressUrl(address) {
  return EXPLORER_URL + '/address/' + address
}

export function ipfsGatewayUrl(tokenURI) {
  if (!tokenURI) return ''
  return 'https://gateway.pinata.cloud/ipfs/' + tokenURI.replace('ipfs://', '')
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    return false
  }
}

// Fake but real looking values, used when the mock service mints something new.
const HEX = '0123456789abcdef'
const B32 = 'abcdefghijklmnopqrstuvwxyz234567'

export function randomTxHash() {
  let out = '0x'
  for (let i = 0; i < 64; i += 1) out += HEX[Math.floor(Math.random() * 16)]
  return out
}

export function randomCid() {
  let out = 'bafybei'
  for (let i = 0; i < 52; i += 1) out += B32[Math.floor(Math.random() * 32)]
  return out
}
