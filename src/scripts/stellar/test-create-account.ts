import { Keypair, Horizon } from "@stellar/stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

(async () => {
  const keypair = Keypair.random();
  console.log("🔐 Public Key:", keypair.publicKey());
  console.log("🗝️ Secret Key:", keypair.secret());

  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
    if (!res.ok) throw new Error(await res.text());
    console.log("✅ Cuenta fondeada");
  } catch (e) {
    console.error("❌ Error al fondear cuenta:", e);
    return;
  }

  try {
    const account = await server.accounts().accountId(keypair.publicKey()).call();
    console.log("✅ Cuenta existe");
    console.log("💰 Balances:", account.balances);
  } catch (e) {
    console.error("❌ Error al verificar cuenta:", e);
  }
})();
