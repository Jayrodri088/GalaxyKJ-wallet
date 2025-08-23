import { useEffect, useState } from "react"
import { openDB } from "idb"
import { decryptPrivateKey } from "@/lib/crypto"
import { Keypair } from "@stellar/stellar-sdk"
import { useWalletStore } from "@/store/wallet-store"

const DB_NAME = "wallet-db"
const STORE_NAME = "encrypted-wallet"

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
        console.log("🔍 Checking if wallet exists...")
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            // Create the object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, {
                keyPath: "id",
                autoIncrement: true
              })
              // Create any indexes if needed
              store.createIndex("wallet", "wallet", { unique: false })
            }
          },
        })
        const wallets = await db.getAll(STORE_NAME)
        console.log(`📊 Found ${wallets.length} wallets during initial check`)
        const hasWalletValue = wallets && wallets.length > 0
        console.log(`✅ hasWallet set to: ${hasWalletValue}`)
        setHasWallet(hasWalletValue)
      } catch (error) {
        console.error("❌ Error checking wallet:", error)
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
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          // Create the object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: "id",
              autoIncrement: true
            })
            // Create any indexes if needed
            store.createIndex("wallet", "wallet", { unique: false })
          }
        },
      })
      
      const wallets = await db.getAll(STORE_NAME)
      console.log("Found wallets in database:", wallets.length)
      
      if (!wallets || wallets.length === 0) {
        setError("Wallet not found.")
        return
      }

      // Get the first wallet (assuming single wallet for now)
      const walletData = wallets[0]
      console.log("Wallet data found:", !!walletData.wallet)
      const encrypted = walletData.wallet

      console.log("Attempting to decrypt wallet...")
      const decryptedPrivateKey = await decryptPrivateKey(encrypted, password)
      console.log("Wallet decrypted successfully")
      const keypair = Keypair.fromSecret(decryptedPrivateKey)
      const publicKey = keypair.publicKey()

      setPublicKey(publicKey)
      onSuccess(decryptedPrivateKey)
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error) {
        setError(`Error: ${error.message}`)
      } else {
        setError("Incorrect password. Please try again.")
      }
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
