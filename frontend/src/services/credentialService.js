// The ONLY service the pages and components import.
// It picks the implementation once, at load, from VITE_DEMO_MODE:
//
//   VITE_DEMO_MODE=true   -> mockService.js  (seeded data, no wallet, role switcher)
//   VITE_DEMO_MODE=false  -> chainService.js (real ethers calls to the contract)
//
// Both files export the same function names with the same shapes, so nothing
// upstream changes when the switch flips.

import * as mock from './mockService'
import * as chain from './chainService'
import { DEMO_MODE } from '../utils/network'

const impl = DEMO_MODE ? mock : chain

export const isDemoMode = DEMO_MODE

export const connectWallet = (...args) => impl.connectWallet(...args)
export const getConnectedWallet = (...args) => impl.getConnectedWallet(...args)
export const disconnectWallet = (...args) => impl.disconnectWallet(...args)

export const isIssuer = (...args) => impl.isIssuer(...args)
export const getOwner = (...args) => impl.getOwner(...args)

export const getCertificatesOf = (...args) => impl.getCertificatesOf(...args)
export const getCertificate = (...args) => impl.getCertificate(...args)
export const getIssuedBy = (...args) => impl.getIssuedBy(...args)
export const getIssuers = (...args) => impl.getIssuers(...args)

export const mintCertificate = (...args) => impl.mintCertificate(...args)
export const revokeCertificate = (...args) => impl.revokeCertificate(...args)
export const addIssuer = (...args) => impl.addIssuer(...args)
export const removeIssuer = (...args) => impl.removeIssuer(...args)

// Chain mode only. Used by the wallet hook when MetaMask switches account.
export const setConnectedWallet = (address) =>
  typeof impl.setConnectedWallet === 'function' ? impl.setConnectedWallet(address) : null
