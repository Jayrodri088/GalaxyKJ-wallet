import { openDB } from "idb"

const DB_NAME = "galaxy-wallet-db"
const STORE_NAME = "encrypted-wallet"
const STORE_KEY = "wallet"

export async function encryptPrivateKey(secretKey: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    enc.encode(secretKey)
  )

  const encryptedData = {
    ciphertext: Array.from(new Uint8Array(ciphertext)),
    salt: Array.from(salt),
    iv: Array.from(iv),
  }

  return JSON.stringify(encryptedData)
}

export async function saveEncryptedWallet(encrypted: string) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME)
    },
  })
  await db.put(STORE_NAME, encrypted, STORE_KEY)
}

// Opcional, para cuando quieras permitir recuperación
export async function decryptPrivateKey(encryptedStr: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  const encrypted = JSON.parse(encryptedStr)
  const salt = new Uint8Array(encrypted.salt)
  const iv = new Uint8Array(encrypted.iv)
  const data = new Uint8Array(encrypted.ciphertext)

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  )

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    data
  )

  return dec.decode(decrypted)
}
