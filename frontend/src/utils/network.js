// One place that knows which chain we are on and where the contract lives.
// Everything comes from frontend/.env, with sensible local defaults.

import addresses from '../contracts/addresses.json'

// true  -> mock data and the demo role switcher (for presentations)
// false -> real contract calls through ethers
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337)
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'
export const DEPLOY_BLOCK = Number(import.meta.env.VITE_DEPLOY_BLOCK || 0)
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || ''
export const EXPLORER_URL = (import.meta.env.VITE_EXPLORER_URL || '').replace(/\/$/, '')

// The local chain has no block explorer, so links are hidden instead of broken.
export const HAS_EXPLORER = EXPLORER_URL.length > 0

const CHAIN_NAMES = {
  31337: 'Hardhat Local',
  11155111: 'Sepolia Testnet',
}

export const NETWORK_NAME = CHAIN_NAMES[CHAIN_ID] || 'Chain ' + CHAIN_ID

// Address written by backend/scripts/exportAbi.js after each deploy.
// In demo mode nothing is deployed, so fall back to a placeholder that keeps
// the status strip and footer looking right during a presentation.
const DEMO_PLACEHOLDER = '0x5A9f83Cd21B7E406fA13c8D57e29B04a6C8F31E2'

export const CONTRACT_ADDRESS =
  addresses[String(CHAIN_ID)] || (DEMO_MODE ? DEMO_PLACEHOLDER : '')

export function explorerTxUrl(txHash) {
  if (!HAS_EXPLORER || !txHash) return ''
  return EXPLORER_URL + '/tx/' + txHash
}

export function explorerAddressUrl(address) {
  if (!HAS_EXPLORER || !address) return ''
  return EXPLORER_URL + '/address/' + address
}

// Used by the wallet hook when MetaMask is on the wrong network.
export function chainIdHex() {
  return '0x' + CHAIN_ID.toString(16)
}

export function addChainParams() {
  return {
    chainId: chainIdHex(),
    chainName: NETWORK_NAME,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [RPC_URL],
    blockExplorerUrls: HAS_EXPLORER ? [EXPLORER_URL] : undefined,
  }
}
