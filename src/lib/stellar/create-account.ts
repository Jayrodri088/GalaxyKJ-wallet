import { Keypair, Server } from 'stellar-sdk';
import { STELLAR_CONFIG } from './config';

export async function createStellarAccount() {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  const server = new Server(STELLAR_CONFIG.horizonURL);

  try {
    if (STELLAR_CONFIG.friendbotURL) {
      const res = await fetch(`${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`);
      if (!res.ok) throw new Error(await res.text());
    }

    const account = await server.loadAccount(publicKey);

    const result = {
      publicKey,
      secretKey,
      balances: account.balances,
    };

    console.log('✅ Account created:', result);
    return result;
  } catch (err: any) {
    console.error('❌ Error creating account:', err.message || err);
    throw err;
  }
}
