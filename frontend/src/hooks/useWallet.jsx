// Wallet + demo role state for the whole app.
// Connection is mocked until Phase E. Switching the demo role switches which
// demo wallet is treated as connected.

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { connectWallet, disconnectWallet } from '../services/credentialService'
import { ADMIN_ADDRESS, ISSUER_ADDRESS, STUDENT_ADDRESS } from '../data/mockIssuers'
import { CHAIN_ID } from '../utils/format'

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

export function WalletProvider({ children }) {
  const [roleId, setRoleId] = useState('issuer')
  const [wallet, setWallet] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const role = getRole(roleId)

  const connect = useCallback(
    async (targetRoleId) => {
      const next = getRole(targetRoleId || roleId)
      setConnecting(true)
      try {
        const result = await connectWallet(next.address)
        setWallet(result)
        setRoleId(next.id)
        return result
      } finally {
        setConnecting(false)
      }
    },
    [roleId]
  )

  const disconnect = useCallback(() => {
    disconnectWallet()
    setWallet(null)
  }, [])

  // Switching role while connected reconnects as that demo wallet straight away.
  const switchRole = useCallback(
    (nextRoleId) => {
      const next = getRole(nextRoleId)
      setRoleId(next.id)
      if (wallet) {
        // Update the UI straight away, and keep the service in sync behind it.
        setWallet({ address: next.address, chainId: CHAIN_ID })
        connectWallet(next.address)
      }
    },
    [wallet]
  )

  const value = useMemo(
    () => ({
      wallet,
      address: wallet ? wallet.address : null,
      chainId: wallet ? wallet.chainId : CHAIN_ID,
      isConnected: Boolean(wallet),
      connecting,
      role,
      roleId,
      switchRole,
      connect,
      disconnect,
    }),
    [wallet, connecting, role, roleId, switchRole, connect, disconnect]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
