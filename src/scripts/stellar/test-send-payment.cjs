const { Keypair, Server, TransactionBuilder, Operation, Asset, Networks } = require('stellar-sdk');

// Cuenta emisora (debe tener fondos en testnet)
const senderSecret = 'SBUI2RZV3GH6QZHQFOZP7DQI5HD7AD6FAJUVHSGMVO4QJVX6BCWJAU7F';
const senderKeypair = Keypair.fromSecret(senderSecret);
const senderPublic = senderKeypair.publicKey();

// Cuenta receptora
const receiverPublic = 'GBXRDFAKXIAOEYJ5V4W73XA4CSFN6CLXMS3VQSFEJBQQ7X2XY26D7WUU';

const server = new Server('https://horizon-testnet.stellar.org');

(async () => {
  try {
    console.log('🚀 Enviando pago de 10 XLM a la cuenta receptora...');

    const sourceAccount = await server.loadAccount(senderPublic);

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({
        destination: receiverPublic,
        asset: Asset.native(),
        amount: '10'
      }))
      .setTimeout(30)
      .build();

    transaction.sign(senderKeypair);

    const result = await server.submitTransaction(transaction);
    console.log('✅ Transacción exitosa:', result.hash);
  } catch (e) {
    console.error('❌ Error al enviar pago:', e.response?.data || e.message || e);
  }
})();
