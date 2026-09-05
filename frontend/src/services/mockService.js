// The mock implementation of the service layer.
// Used when VITE_DEMO_MODE=true, so the demo role switcher and the seeded
// certificates still work on stage without a chain or a wallet.
// The real implementation lives in chainService.js. Same function names.

import {
  getStore,
  findCertificate,
  certificatesOwnedBy,
  certificatesIssuedBy,
  addCertificate,
  takeNextTokenId,
  markRevoked,
} from '../data/mockStore'
import { getAttr } from '../utils/metadata'
import { CHAIN_ID, randomTxHash, randomCid } from '../utils/format'

// Small delay so loading states are actually visible in the demo.
function wait(min = 500, max = 1500) {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let connected = null

// Shape a stored certificate into what the contract's verifyCertificate returns.
function toCertificate(cert) {
  if (!cert) return null
  return {
    tokenId: cert.tokenId,
    valid: !cert.revoked,
    revoked: cert.revoked,
    revokedReason: cert.revokedReason,
    owner: cert.owner,
    issuer: cert.issuer,
    issuedAt: cert.issuedAt,
    tokenURI: cert.tokenURI,
    metadata: cert.metadata,
    // Extra for the UI. At integration this comes from the CertificateMinted event.
    txHash: cert.txHash,
    cid: cert.cid,
  }
}

export async function connectWallet(address) {
  await wait(600, 1000)
  const target = address || getStore().issuers[0].address
  connected = { address: target, chainId: CHAIN_ID }
  return connected
}

export function getConnectedWallet() {
  return connected
}

export function disconnectWallet() {
  connected = null
}

// Demo mode is always on the right chain and always reachable.
export async function getWalletChainId() {
  return CHAIN_ID
}

export async function switchToAppChain() {
  return true
}

export async function isChainReachable() {
  return true
}

export async function isIssuer(address) {
  await wait(200, 400)
  if (!address) return false
  const lower = address.toLowerCase()
  return getStore().issuers.some((i) => i.address.toLowerCase() === lower && i.active)
}

export async function getOwner() {
  await wait(200, 400)
  return getStore().owner
}

export async function getCertificatesOf(address) {
  await wait()
  return certificatesOwnedBy(address).map((c) => c.tokenId)
}

export async function getCertificate(tokenId) {
  await wait()
  const id = Number(tokenId)
  if (!Number.isFinite(id)) return null
  return toCertificate(findCertificate(id))
}

export async function getIssuedBy(issuerAddress) {
  await wait()
  return certificatesIssuedBy(issuerAddress).map(toCertificate)
}

export async function getIssuers() {
  await wait(300, 700)
  return getStore().issuers.map((i) => ({
    address: i.address,
    name: i.name,
    role: i.role,
    active: i.active,
  }))
}

export async function mintCertificate({ to, metadata }, onProgress) {
  const report = (stage) => {
    if (typeof onProgress === 'function') onProgress(stage)
  }

  try {
    report('preparing')
    await wait(700, 1100)

    report('uploading')
    await wait(900, 1500)
    const cid = randomCid()

    report('awaiting_wallet')
    await wait(1100, 1600)

    report('confirming')
    await wait(1200, 1800)

    const tokenId = takeNextTokenId()
    const txHash = randomTxHash()
    const issuerAddress = (connected && connected.address) || getStore().issuers[1].address
    const date = getAttr(metadata, 'date')

    addCertificate({
      tokenId,
      owner: to,
      student: getAttr(metadata, 'student'),
      studentId: getAttr(metadata, 'studentId'),
      issuer: issuerAddress,
      institution: getAttr(metadata, 'institution'),
      title: getAttr(metadata, 'title') || 'Certificate of Achievement',
      course: getAttr(metadata, 'course'),
      grade: getAttr(metadata, 'grade'),
      date,
      expiry: getAttr(metadata, 'expiry'),
      skills: getAttr(metadata, 'skills'),
      description: getAttr(metadata, 'summary'),
      issuedAt: Date.now(),
      revoked: false,
      revokedReason: '',
      cid,
      tokenURI: 'ipfs://' + cid,
      txHash,
    })

    report('done')
    return { tokenId, txHash, tokenURI: 'ipfs://' + cid, cid }
  } catch (err) {
    report('error')
    throw err
  }
}

export async function revokeCertificate(tokenId, onProgress, reason) {
  const report = (stage) => {
    if (typeof onProgress === 'function') onProgress(stage)
  }

  try {
    report('preparing')
    await wait(500, 800)

    report('awaiting_wallet')
    await wait(900, 1400)

    report('confirming')
    await wait(1000, 1600)

    const cert = markRevoked(tokenId, reason)
    if (!cert) throw new Error('Credential ' + tokenId + ' does not exist')

    const txHash = randomTxHash()
    cert.revokeTxHash = txHash
    report('done')
    return { txHash }
  } catch (err) {
    report('error')
    throw err
  }
}

export async function addIssuer(address, onProgress) {
  const report = (stage) => {
    if (typeof onProgress === 'function') onProgress(stage)
  }

  try {
    report('preparing')
    await wait(400, 700)
    report('awaiting_wallet')
    await wait(800, 1300)
    report('confirming')
    await wait(900, 1400)

    const store = getStore()
    const lower = address.toLowerCase()
    const existing = store.issuers.find((i) => i.address.toLowerCase() === lower)
    if (existing) {
      existing.active = true
    } else {
      store.issuers.push({
        address,
        name: 'New Issuer',
        role: 'Authorized Issuer',
        department: '',
        institution: '',
        active: true,
      })
    }

    report('done')
    return { txHash: randomTxHash() }
  } catch (err) {
    report('error')
    throw err
  }
}

export async function removeIssuer(address, onProgress) {
  const report = (stage) => {
    if (typeof onProgress === 'function') onProgress(stage)
  }

  try {
    report('preparing')
    await wait(400, 700)
    report('awaiting_wallet')
    await wait(800, 1300)
    report('confirming')
    await wait(900, 1400)

    const store = getStore()
    const lower = address.toLowerCase()
    const existing = store.issuers.find((i) => i.address.toLowerCase() === lower)
    if (existing) existing.active = false

    report('done')
    return { txHash: randomTxHash() }
  } catch (err) {
    report('error')
    throw err
  }
}
