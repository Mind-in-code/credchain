// In-memory store for the whole demo session.
// Seeded once from the mock files. Minting or revoking updates this, so every
// page in the same browser session sees the same data. A page refresh resets it.

import { mockCertificates } from './mockCertificates'
import { mockIssuers, mockStudents, ADMIN_ADDRESS } from './mockIssuers'
import { buildMetadata } from '../utils/metadata'

function withMetadata(cert) {
  return { ...cert, metadata: buildMetadata(cert) }
}

const store = {
  owner: ADMIN_ADDRESS,
  issuers: mockIssuers.map((i) => ({ ...i })),
  students: mockStudents.map((s) => ({ ...s })),
  certificates: mockCertificates.map(withMetadata),
  nextTokenId: Math.max(...mockCertificates.map((c) => c.tokenId)) + 1,
}

export function getStore() {
  return store
}

export function findCertificate(tokenId) {
  return store.certificates.find((c) => c.tokenId === Number(tokenId)) || null
}

export function certificatesOwnedBy(address) {
  if (!address) return []
  const lower = address.toLowerCase()
  return store.certificates.filter((c) => c.owner.toLowerCase() === lower)
}

export function certificatesIssuedBy(address) {
  if (!address) return []
  const lower = address.toLowerCase()
  return store.certificates.filter((c) => c.issuer.toLowerCase() === lower)
}

export function addCertificate(cert) {
  store.certificates = [...store.certificates, withMetadata(cert)]
  return findCertificate(cert.tokenId)
}

export function takeNextTokenId() {
  const id = store.nextTokenId
  store.nextTokenId += 1
  return id
}

export function markRevoked(tokenId, reason) {
  const cert = findCertificate(tokenId)
  if (!cert) return null
  cert.revoked = true
  cert.revokedReason = reason || 'Revoked by issuer'
  return cert
}
