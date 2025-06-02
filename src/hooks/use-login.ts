import { useEffect, useState } from "react"
import { openDB } from "idb"
import { decryptPrivateKey } from "@/lib/crypto"
import { Keypair } from "@stellar/stellar-sdk"
import { useWalletStore } from "@/store/wallet-store"

const DB_NAME = "galaxy-wallet-db"
const STORE_NAME = "encrypted-wallet"
const STORE_KEY = "wallet"

export function useLogin(onSuccess: (privateKey: string) => void) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasWallet, setHasWallet] = useState(false)

  const setPublicKey = useWalletStore((state) => state.setPublicKey)

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const db = await openDB(DB_NAME, 1)
        const value = await db.get(STORE_NAME, STORE_KEY)
        setHasWallet(!!value)
      } catch {
        setHasWallet(false)
      }
    }

    checkWallet()
  }, [])

  const unlockWallet = async () => {
    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const db = await openDB(DB_NAME, 1)
      const encrypted = await db.get(STORE_NAME, STORE_KEY)

      if (!encrypted) {
        setError("Wallet not found.")
        return
      }

      const decryptedPrivateKey = await decryptPrivateKey(encrypted, password)
      const keypair = Keypair.fromSecret(decryptedPrivateKey)
      const publicKey = keypair.publicKey()

      setPublicKey(publicKey)
      onSuccess(decryptedPrivateKey)
    } catch {
      setError("Incorrect password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    hasWallet,
    unlockWallet,
    setError,
  }
}
