import { useState } from "react";
import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Networks,
} from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export function useStellarPayment(sourceSecret: string) {
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<null | {
    success: boolean;
    hash?: string;
    error?: string;
  }>(null);

  const server = new StellarSdk.Horizon.Server(HORIZON_URL);
  const sourceKeypair = Keypair.fromSecret(sourceSecret);

  // Estimate fee and time
  const estimations = async () => {
    try {
      const basefee = await server.fetchBaseFee();

      const feeXLM = (basefee * 0.0000001).toFixed(6);

      return {
        estimatedFee: feeXLM,
        estimatedTime: 5,
      };
    } catch (err: any) {
      return {
        error: err.message || "Unknown error while estimating transaction",
      };
    }
  };

  const sendXLM = async ({
    destination,
    amount,
    memo,
  }: {
    destination: string;
    amount: string;
    memo?: string;
  }) => {
    setLoading(true);
    setTxResult(null);

    try {
      if (
        !destination ||
        destination.length !== 56 ||
        !destination.startsWith("G")
      ) {
        throw new Error("Invalid_Stellar_address");
      }

      Keypair.fromPublicKey(destination);

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid_amount");
      }

      const account = await server.loadAccount(sourceKeypair.publicKey());

      const fee = await server.fetchBaseFee();

      const txBuilder = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: parsedAmount.toFixed(7),
        })
      );

      console.log(txBuilder);

      if (memo) {
        txBuilder.addMemo(Memo.text(memo));
      }

      const transaction = txBuilder.setTimeout(180).build();
      transaction.sign(sourceKeypair);

      const response = await server.submitTransaction(transaction);

      console.log(response);

      setTxResult({ success: true, hash: response.hash });
    } catch (err: any) {
      setTxResult({ success: false, error: err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return {
    sendXLM,
    loading,
    txResult,
    estimations,
  };
}
