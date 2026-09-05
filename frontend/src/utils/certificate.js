// Turns a service certificate into the flat fields the UI renders.
// Everything display related is read out of the IPFS metadata, so this keeps
// working once the service talks to the real contract.

import { getAttr } from './metadata'

export function certificateView(cert) {
  if (!cert) return null
  const m = cert.metadata
  return {
    tokenId: cert.tokenId,
    valid: cert.valid,
    revoked: cert.revoked,
    revokedReason: cert.revokedReason,
    owner: cert.owner,
    issuer: cert.issuer,
    issuedAt: cert.issuedAt,
    tokenURI: cert.tokenURI,
    cid: cert.cid || (cert.tokenURI || '').replace('ipfs://', ''),
    txHash: cert.txHash,
    student: getAttr(m, 'student'),
    studentId: getAttr(m, 'studentId'),
    course: getAttr(m, 'course'),
    institution: getAttr(m, 'institution'),
    grade: getAttr(m, 'grade'),
    date: getAttr(m, 'date'),
    expiry: getAttr(m, 'expiry'),
    skills: getAttr(m, 'skills'),
    title: getAttr(m, 'title') || 'Certificate of Achievement',
    description: getAttr(m, 'summary'),
  }
}
