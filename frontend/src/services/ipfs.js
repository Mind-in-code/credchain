// Metadata storage. Pinata when a JWT is set, otherwise an inline data URI so
// the local chain demo works before Pinata is configured.

import { PINATA_JWT } from '../utils/network'

const PINATA_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
const GATEWAYS = ['https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/']

export const hasPinataKey = () => PINATA_JWT.length > 0

function toDataUri(json) {
  const text = JSON.stringify(json)
  // btoa cannot handle non-Latin1 characters, so encode to UTF-8 bytes first.
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return 'data:application/json;base64,' + btoa(binary)
}

/// Returns { uri, storedInline }. Never throws: falls back to inline storage.
export async function uploadToPinata(json) {
  if (!hasPinataKey()) {
    return { uri: toDataUri(json), storedInline: true }
  }

  try {
    const response = await fetch(PINATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + PINATA_JWT,
      },
      body: JSON.stringify({
        pinataContent: json,
        pinataMetadata: { name: json.name || 'CredChain credential' },
      }),
    })

    if (!response.ok) throw new Error('Pinata responded ' + response.status)

    const data = await response.json()
    if (!data.IpfsHash) throw new Error('Pinata returned no IpfsHash')

    return { uri: 'ipfs://' + data.IpfsHash, storedInline: false }
  } catch (err) {
    // Never block a mint because pinning failed.
    return { uri: toDataUri(json), storedInline: true, error: err.message }
  }
}

/// Reads metadata back. Returns null on failure, never throws.
export async function fetchMetadata(uri) {
  if (!uri) return null

  try {
    if (uri.startsWith('data:')) {
      const comma = uri.indexOf(',')
      const payload = uri.slice(comma + 1)
      const text = uri.slice(0, comma).includes('base64')
        ? new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)))
        : decodeURIComponent(payload)
      return JSON.parse(text)
    }

    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '')
      for (const gateway of GATEWAYS) {
        try {
          const response = await fetch(gateway + cid)
          if (response.ok) return await response.json()
        } catch (err) {
          // try the next gateway
        }
      }
      return null
    }

    const response = await fetch(uri)
    return response.ok ? await response.json() : null
  } catch (err) {
    return null
  }
}

// A short label for the UI. Data URIs have no CID to show.
export function cidFromUri(uri) {
  if (!uri || uri.startsWith('data:')) return ''
  return uri.replace('ipfs://', '')
}
