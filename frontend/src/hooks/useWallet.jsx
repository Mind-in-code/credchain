// Wallet state for the whole app.
//
// Demo mode: connection is faked and a role switcher picks which demo wallet is
// "connected", so the issuer, student and verifier views can be shown on stage.
// Chain mode: real MetaMask, and the role switcher is hidden.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  connectWallet,
  disconnectWallet,
  setConnectedWallet,
} from '../services/credentialService'
import { ADMIN_ADDRESS, ISSUER_ADDRESS, STUDENT_ADDRESS, getIssuerByAddress } from '../data/mockIssuers'
import { CHAIN_ID, DEMO_MODE } from '../utils/network'
import { shortAddress } from '../utils/format'

const WalletContext = createContext(null)

export const DEMO_ROLES = [
  {
    id: 'issuer',
    label: 'Issuer',
    address: ISSUER_ADDRESS,
    name: 'Registrar Office',
    description: 'Whitelisted wallet, can issue and revoke credentials',
  },
  {
    id: 'student',
    label: 'Student',
    address: STUDENT_ADDRESS,
    name: 'Aarav Sharma',
    description: 'Holds credentials in their wallet',
  },
  {
    id: 'verifier',
    label: 'Verifier',
    address: '0xB2e70Fa5D148c39067EbA2c1957D0f38A6C4E71b',
    name: 'Public Verifier',
    description: 'Can verify any credential without a wallet',
  },
]

export function getRole(roleId) {
  return DEMO_ROLES.find((r) => r.id === roleId) || DEMO_ROLES[0]
}

// In chain mode there is no demo role. Build a label from the wallet itself.
function roleForAddress(address) {
  if (!address) return { id: 'wallet', label: 'Wallet', name: 'Not connected', address: null }
  const known = getIssuerByAddress(address)
  return {
    id: 'wallet',
    label: 'Connected',
    name: known ? known.name : shortAddress(address, 6, 4),
    address,
  }
}

export function WalletProvider({ children }) {
  const [roleId, setRoleId] = useState('issuer')
  const [wallet, setWallet] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  // Chain mode: follow MetaMask. Account switch updates the app, network
  // switch reloads so every provider is rebuilt against the new chain.
  useEffect(() => {
    if (DEMO_MODE) return undefined
    if (typeof window === 'undefined' || !window.ethereum) return undefined

    const onAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setConnectedWallet(null)
        setWallet(null)
        return
      }
      setConnectedWallet(accounts[0])
      setWallet({ address: accounts[0], chainId: CHAIN_ID })
    }

    const onChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [])

  const connect = useCallback(
    async (targetRoleId) => {
      setConnecting(true)
      setError('')
      try {
        if (DEMO_MODE) {
          const next = getRole(targetRoleId || roleId)
          const result = await connectWallet(next.address)
          setWallet(result)
          setRoleId(next.id)
          return result
        }

        const result = await connectWallet()
        setWallet(result)
        return result
      } catch (err) {
        setError(err.message || 'Could not connect the wallet.')
        throw err
      } finally {
        setConnecting(false)
      }
    },
    [roleId]
  )

  const disconnect = useCallback(() => {
    disconnectWallet()
    setWallet(null)
    setError('')
  }, [])

  // Demo mode only. Switching role reconnects as that demo wallet.
  const switchRole = useCallback(
    (nextRoleId) => {
      if (!DEMO_MODE) return
      const next = getRole(nextRoleId)
      setRoleId(next.id)
      if (wallet) {
        setWallet({ address: next.address, chainId: CHAIN_ID })
        connectWallet(next.address)
      }
    },
    [wallet]
  )

  const role = DEMO_MODE ? getRole(roleId) : roleForAddress(wallet ? wallet.address : null)

  const value = useMemo(
    () => ({
      wallet,
      address: wallet ? wallet.address : null,
      chainId: wallet ? wallet.chainId : CHAIN_ID,
      isConnected: Boolean(wallet),
      connecting,
      error,
      role,
      roleId,
      switchRole,
      connect,
      disconnect,
      isDemoMode: DEMO_MODE,
      adminAddress: ADMIN_ADDRESS,
    }),
    [wallet, connecting, error, role, roleId, switchRole, connect, disconnect]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
