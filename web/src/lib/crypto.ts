import { openDB } from "idb"

const DB_NAME = "galaxy-wallet-db"
const STORE_NAME = "encrypted-wallet"
const STORE_KEY = "wallet"

export async function encryptPrivateKey(secretKey: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  
  let keyMaterial: CryptoKey | null = null
  let derivedKey: CryptoKey | null = null
  let ciphertext: ArrayBuffer | null = null
  let passwordBytes: Uint8Array | null = null
  let secretKeyBytes: Uint8Array | null = null

  try {
    passwordBytes = enc.encode(password)
    secretKeyBytes = enc.encode(secretKey)
    
    keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )

    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    derivedKey = await window.crypto.subtle.deriveKey(
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

    ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      secretKeyBytes
    )

    const encryptedData = {
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      salt: Array.from(salt),
      iv: Array.from(iv),
    }

    return JSON.stringify(encryptedData)
  } finally {
    if (passwordBytes) {
      passwordBytes.fill(0)
    }
    
    if (secretKeyBytes) {
      secretKeyBytes.fill(0)
    }
    
    if (ciphertext) {
      new Uint8Array(ciphertext).fill(0)
    }
    
    keyMaterial = null
    derivedKey = null
    ciphertext = null
    
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }
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
  
  let keyMaterial: CryptoKey | null = null
  let derivedKey: CryptoKey | null = null
  let decrypted: ArrayBuffer | null = null
  let passwordBytes: Uint8Array | null = null

  try {
    const encrypted = JSON.parse(encryptedStr)
    const salt = new Uint8Array(encrypted.salt)
    const iv = new Uint8Array(encrypted.iv)
    const data = new Uint8Array(encrypted.ciphertext)

    passwordBytes = enc.encode(password)
    keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )

    derivedKey = await window.crypto.subtle.deriveKey(
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

    decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      data
    )

    return dec.decode(decrypted)
  } finally {
    if (passwordBytes) {
      passwordBytes.fill(0)
    }
    
    if (decrypted) {
      new Uint8Array(decrypted).fill(0)
    }
    
    keyMaterial = null
    derivedKey = null
    decrypted = null
    
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }
}
