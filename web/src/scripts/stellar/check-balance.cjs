const { Server } = require('stellar-sdk');

// Leer la public key desde argumentos
const publicKey = process.argv[2];

if (!publicKey) {
  console.error('❌ Debes proporcionar una public key como argumento.');
  console.log('👉 Ejemplo: node scripts/stellar/check-balance.cjs GBXXXX...');
  process.exit(1);
}

const server = new Server('https://horizon-testnet.stellar.org');

(async () => {
  try {
    const account = await server.loadAccount(publicKey);
    console.log('✅ Cuenta encontrada:', publicKey);
    console.log('💰 Balances:');
    account.balances.forEach((balance) => {
      console.log(`  - ${balance.balance} (${balance.asset_type})`);
    });
  } catch (e) {
    console.error('❌ Error al obtener balance:', e.response?.data || e.message || e);
  }
})();
