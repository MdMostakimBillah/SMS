import { useEffect, useState } from 'react'
import { getVaultStatus, subscribeVault, type VaultStatus } from '@/lib/vault/vault'

/** Live view of the Local Data Vault status. */
export function useVault(): VaultStatus {
  const [status, setStatus] = useState<VaultStatus>(getVaultStatus)
  useEffect(() => subscribeVault(setStatus), [])
  return status
}
