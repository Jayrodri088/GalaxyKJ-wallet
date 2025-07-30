const { Server } = require('stellar-sdk');

// Leer public key desde argumentos
const publicKey = process.argv[2];

if (!publicKey) {
  console.error('❌ Debes proporcionar una public key como argumento.');
  console.log('👉 Ejemplo: node scripts/stellar/check-history.cjs GBXXXX...');
  process.exit(1);
}

const server = new Server('https://horizon-testnet.stellar.org');

(async () => {
  try {
    const txPage = await server
      .transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(10)
      .call();

    console.log(`📜 Últimas transacciones de: ${publicKey}\n`);

    if (txPage.records.length === 0) {
      console.log('⚠️ Esta cuenta no tiene transacciones aún.');
      return;
    }

    txPage.records.forEach((tx, i) => {
      console.log(`🔹 Transacción ${i + 1}`);
      console.log(`🆔 Hash:        ${tx.hash}`);
      console.log(`📅 Fecha:       ${tx.created_at}`);
      console.log(`🔐 Source:      ${tx.source_account}`);
      console.log(`📦 Successful:  ${tx.successful}`);
      console.log(`🔗 Explorer:    https://testnet.stellar.expert/explorer/public/tx/${tx.hash}`);
      console.log('---');
    });
  } catch (e) {
    console.error('❌ Error al consultar historial:', e.response?.data || e.message || e);
  }
})();
