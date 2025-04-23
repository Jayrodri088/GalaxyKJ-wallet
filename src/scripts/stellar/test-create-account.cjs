const { Keypair, Server } = require('stellar-sdk');

const server = new Server('https://horizon-testnet.stellar.org');

(async () => {
  const keypair = Keypair.random();
  console.log('🔐 Public Key:', keypair.publicKey());
  console.log('🗝️ Secret Key:', keypair.secret());

  try {
    await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
    console.log('✅ Cuenta fondeada');
  } catch (e) {
    console.error('❌ Error al fondear cuenta:', e);
    return;
  }

  try {
    const account = await server.loadAccount(keypair.publicKey());
    console.log('✅ Cuenta existe');
    console.log('💰 Balances:', account.balances);
  } catch (e) {
    console.error('❌ Error al verificar cuenta:', e);
  }
})();
