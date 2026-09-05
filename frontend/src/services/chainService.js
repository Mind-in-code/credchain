// The real implementation of the service layer: ethers v6 against
// SoulboundCertificate.sol. Same function names and shapes as mockService.js,
// so no page or component has to know which one is running.

import { ethers } from 'ethers'
import artifact from '../contracts/SoulboundCertificate.json'
import { uploadToPinata, fetchMetadata, cidFromUri } from './ipfs'
import { friendlyError, isNonexistentToken } from '../utils/errors'
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  DEPLOY_BLOCK,
  RPC_URL,
  addChainParams,
  chainIdHex,
} from '../utils/network'

const ABI = artifact.abi

let connected = null

function requireAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      'No contract address for chain ' +
        CHAIN_ID +
        '. Deploy the contract, then run `npm run export-abi` in backend/.'
    )
  }
  return CONTRACT_ADDRESS
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

// Reads never need a wallet. The Verify page must work for anyone.
function readProvider() {
  if (RPC_URL) return new ethers.JsonRpcProvider(RPC_URL)
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  throw new Error('No RPC URL set and no wallet available.')
}

function readContract() {
  return new ethers.Contract(requireAddress(), ABI, readProvider())
}

// Writes need MetaMask.
async function writeContract() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed.')
  }
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return new ethers.Contract(requireAddress(), ABI, signer)
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

async function ensureCorrectChain(provider) {
  const network = await provider.getNetwork()
  if (Number(network.chainId) === CHAIN_ID) return

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex() }],
    })
  } catch (err) {
    // 4902 means MetaMask does not know this network yet, so offer to add it.
    if (err.code === 4902 || (err.data && err.data.originalError && err.data.originalError.code === 4902)) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [addChainParams()],
      })
    } else {
      throw err
    }
  }
}

export async function connectWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed. Install it to issue credentials.')
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    await ensureCorrectChain(provider)

    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    connected = { address, chainId: CHAIN_ID }
    return connected
  } catch (err) {
    throw new Error(friendlyError(err))
  }
}

export function getConnectedWallet() {
  return connected
}

export function disconnectWallet() {
  // MetaMask has no programmatic disconnect. We forget the account locally.
  connected = null
}

// Used by the wallet hook when MetaMask reports accountsChanged.
export function setConnectedWallet(address) {
  connected = address ? { address, chainId: CHAIN_ID } : null
  return connected
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function isIssuer(address) {
  if (!address) return false
  try {
    return await readContract().isIssuer(address)
  } catch (err) {
    return false
  }
}

export async function getOwner() {
  return await readContract().owner()
}

export async function getCertificatesOf(address) {
  if (!address) return []
  const ids = await readContract().getCertificatesOf(address)
  return ids.map((id) => Number(id))
}

// Finds the mint transaction so the UI can show a real tx hash.
async function findMintTxHash(contract, tokenId) {
  try {
    const events = await contract.queryFilter(
      contract.filters.CertificateMinted(tokenId),
      DEPLOY_BLOCK,
      'latest'
    )
    return events.length > 0 ? events[0].transactionHash : ''
  } catch (err) {
    return ''
  }
}

export async function getCertificate(tokenId) {
  const id = Number(tokenId)
  if (!Number.isFinite(id)) return null

  const contract = readContract()

  let result
  try {
    result = await contract.verifyCertificate(id)
  } catch (err) {
    // The contract reverts for a token that was never minted.
    if (isNonexistentToken(err)) return null
    throw new Error(friendlyError(err))
  }

  const [valid, owner, issuer, tokenURI, issuedAt, revoked] = result
  const metadata = await fetchMetadata(tokenURI)
  const txHash = await findMintTxHash(contract, id)

  return {
    tokenId: id,
    valid,
    revoked,
    revokedReason: '',
    owner,
    issuer,
    issuedAt: Number(issuedAt) * 1000,
    tokenURI,
    metadata,
    txHash,
    cid: cidFromUri(tokenURI),
    // Lets the UI say "metadata unavailable" instead of showing blank fields.
    metadataUnavailable: metadata === null,
  }
}

export async function getIssuedBy(issuerAddress) {
  if (!issuerAddress) return []

  const contract = readContract()
  const events = await contract.queryFilter(
    contract.filters.CertificateMinted(null, null, issuerAddress),
    DEPLOY_BLOCK,
    'latest'
  )

  const certificates = await Promise.all(
    events.map((event) => getCertificate(Number(event.args.tokenId)))
  )
  return certificates.filter(Boolean)
}

export async function getIssuers() {
  const contract = readContract()

  const [added, removed] = await Promise.all([
    contract.queryFilter(contract.filters.IssuerAdded(), DEPLOY_BLOCK, 'latest'),
    contract.queryFilter(contract.filters.IssuerRemoved(), DEPLOY_BLOCK, 'latest'),
  ])

  const candidates = new Set()
  added.forEach((e) => candidates.add(e.args.issuer))
  removed.forEach((e) => candidates.add(e.args.issuer))

  // Events only tell us who was ever touched. The contract is the truth.
  const list = await Promise.all(
    [...candidates].map(async (address) => ({
      address,
      // Name, role and department are frontend only, the contract has a flat whitelist.
      name: 'Issuer ' + address.slice(0, 6),
      role: 'Whitelisted Issuer',
      active: await contract.isIssuer(address),
    }))
  )

  return list
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function reporter(onProgress) {
  return (stage) => {
    if (typeof onProgress === 'function') onProgress(stage)
  }
}

export async function mintCertificate({ to, metadata }, onProgress) {
  const report = reporter(onProgress)

  try {
    report('preparing')
    const contract = await writeContract()

    report('uploading')
    const { uri, storedInline } = await uploadToPinata(metadata)

    report('awaiting_wallet')
    const tx = await contract.mintCertificate(to, uri)

    report('confirming')
    const receipt = await tx.wait()

    // Pull the tokenId out of the CertificateMinted event.
    let tokenId = null
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log)
        if (parsed && parsed.name === 'CertificateMinted') {
          tokenId = Number(parsed.args.tokenId)
          break
        }
      } catch (err) {
        // not one of our events, skip it
      }
    }

    report('done')
    return {
      tokenId,
      txHash: receipt.hash,
      tokenURI: uri,
      cid: cidFromUri(uri),
      storedInline,
    }
  } catch (err) {
    report('error')
    throw new Error(friendlyError(err))
  }
}

export async function revokeCertificate(tokenId, onProgress) {
  const report = reporter(onProgress)

  try {
    report('preparing')
    const contract = await writeContract()

    report('awaiting_wallet')
    const tx = await contract.revokeCertificate(Number(tokenId))

    report('confirming')
    const receipt = await tx.wait()

    report('done')
    return { txHash: receipt.hash }
  } catch (err) {
    report('error')
    throw new Error(friendlyError(err))
  }
}

export async function addIssuer(address, onProgress) {
  const report = reporter(onProgress)

  try {
    report('preparing')
    const contract = await writeContract()

    report('awaiting_wallet')
    const tx = await contract.addIssuer(address)

    report('confirming')
    const receipt = await tx.wait()

    report('done')
    return { txHash: receipt.hash }
  } catch (err) {
    report('error')
    throw new Error(friendlyError(err))
  }
}

export async function removeIssuer(address, onProgress) {
  const report = reporter(onProgress)

  try {
    report('preparing')
    const contract = await writeContract()

    report('awaiting_wallet')
    const tx = await contract.removeIssuer(address)

    report('confirming')
    const receipt = await tx.wait()

    report('done')
    return { txHash: receipt.hash }
  } catch (err) {
    report('error')
    throw new Error(friendlyError(err))
  }
}
