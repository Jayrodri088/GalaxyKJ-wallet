// Test script para verificar la funcionalidad de wallet
// Ejecutar en el navegador con: node test-wallet.js

const { openDB } = require('idb');

const DB_NAME = "wallet-db";
const STORE_NAME = "encrypted-wallet";

async function testWalletDatabase() {
  console.log("🔍 Testing wallet database...");
  
  try {
    // Abrir la base de datos
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
          store.createIndex("wallet", "wallet", { unique: false });
        }
      },
    });
    
    console.log("✅ Database opened successfully");
    
    // Obtener todas las wallets
    const wallets = await db.getAll(STORE_NAME);
    console.log(`📊 Found ${wallets.length} wallets in database`);
    
    if (wallets.length > 0) {
      console.log("📋 Wallet data:");
      wallets.forEach((wallet, index) => {
        console.log(`  Wallet ${index + 1}:`);
        console.log(`    ID: ${wallet.id}`);
        console.log(`    Has encrypted data: ${!!wallet.wallet}`);
        console.log(`    Created at: ${wallet.createdAt}`);
        console.log(`    Encrypted data length: ${wallet.wallet ? wallet.wallet.length : 0}`);
      });
    } else {
      console.log("❌ No wallets found in database");
    }
    
    await db.close();
    console.log("✅ Database test completed");
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

// Ejecutar la prueba
testWalletDatabase();
