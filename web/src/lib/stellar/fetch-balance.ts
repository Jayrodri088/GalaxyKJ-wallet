import { Server } from "stellar-sdk";
import { STELLAR_CONFIG } from "./config";

export async function fetchStellarBalance(publicKey: string): Promise<number> {
  const server = new Server(STELLAR_CONFIG.horizonURL);

  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return parseFloat(nativeBalance?.balance || "0");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ Error fetching balance:", errorMessage);
    throw err;
  }
}
