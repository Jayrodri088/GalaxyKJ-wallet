import { useState } from "react"
import * as bip39 from "bip39"
import { Keypair } from "@stellar/stellar-sdk"
import { encryptPrivateKey, saveEncryptedWallet } from "@/lib/crypto"
import { useWalletStore } from "@/store/wallet-store"
import { STELLAR_CONFIG } from "@/lib/stellar/config"

export function useCreateWallet(
  onWalletCreated: () => void,
  setIsCreating?: (val: boolean) => void
) {
  const [currentStep, setCurrentStep] = useState(1)
  const [mnemonic] = useState(() => bip39.generateMnemonic())
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicSaved, setMnemonicSaved] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [isCreating, setCreating] = useState(false)

  const setPublicKey = useWalletStore((state) => state.setPublicKey)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Clipboard error:", err)
    }
  }

  const passwordValidation = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    match: password === confirmPassword && password.length > 0,
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((s) => s + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const handleCreateWallet = async () => {
    setCreating(true)
    setIsCreating?.(true)
    try {
      const seed = await bip39.mnemonicToSeed(mnemonic)
      const raw = seed.slice(0, 32)
      const keypair = Keypair.fromRawEd25519Seed(raw)
      const publicKey = keypair.publicKey()

      if (STELLAR_CONFIG.friendbotURL) {
        try {
          const res = await fetch(`${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`)
          if (!res.ok) {
            const errText = await res.text()
            console.warn(`Friendbot error: ${errText}`)
          } else {
            console.log('Account funded successfully via Friendbot')
          }
          await new Promise((r) => setTimeout(r, 1500))
        } catch (error) {
          console.warn('Friendbot request failed:', error)
          // Continue with wallet creation even if friendbot fails
        }
      }

      const encrypted = await encryptPrivateKey(keypair.secret(), password)
      console.log("Wallet encrypted successfully")
      
      await saveEncryptedWallet(encrypted)
      console.log("Wallet saved to database successfully")

      setPublicKey(publicKey)
      onWalletCreated()
    } catch (err) {
      console.error("Wallet creation error:", err)
    } finally {
      setCreating(false)
      setIsCreating?.(false)
    }
  }

  return {
    currentStep,
    setCurrentStep,
    mnemonic,
    showMnemonic,
    setShowMnemonic,
    mnemonicSaved,
    setMnemonicSaved,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isPasswordValid,
    passwordValidation,
    copied,
    copyToClipboard,
    handleNext,
    handleBack,
    handleCreateWallet,
    isCreating,
  }
}
