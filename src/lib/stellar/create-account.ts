import { Keypair } from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "./config";

export async function createStellarAccount() {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  console.log("🆕 Creating account with publicKey:", publicKey);

  try {
    if (STELLAR_CONFIG.friendbotURL) {
      const url = `${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`;
      console.log("📡 Fetching friendbot URL:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Friendbot error:", errorText);
        throw new Error(errorText);
      }
      console.log("✅ Account funded by friendbot");
    }

    const Stellar = await import("@stellar/stellar-sdk");
    const server = new Stellar.Horizon.Server(STELLAR_CONFIG.horizonURL);    
    const account = await server.loadAccount(publicKey);

    console.log("✅ Account exists");
    console.log("💰 Balances:", account.balances);

    return {
      publicKey,
      secretKey,
      balances: account.balances,
    };
  } catch (err) {
    console.error("❌ Error in createStellarAccount:", err);
    return null;
  }
}
