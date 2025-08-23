import * as StellarSdk from "@stellar/stellar-sdk";

interface TxHistoryProp {
  account: string;
  limit: number;
}

type TransactionType = "receive" | "send" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

interface Transaction {
  id: number;
  type: TransactionType;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: string;
  amountFrom?: number;
  amountTo?: number;
  from?: string;
  to?: string;
  date: string;
  status: TransactionStatus;
}

export const fetchTransactions = async (
  data: TxHistoryProp
): Promise<Transaction[]> => {
  // Validate account address format
  if (!data.account || data.account.length < 56) {
    console.warn('Invalid account address provided');
    return [];
  }

  const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

  try {
    // Check if account exists first
    await server.loadAccount(data.account);
  } catch (error) {
    if (error instanceof StellarSdk.NotFoundError) {
      // Account doesn't exist yet - this is normal for new wallets
      console.log(`Account ${data.account} not found on network - likely a new wallet`);
      return [];
    }
    // For other errors, log but don't spam the console
    console.warn('Failed to load account:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }

  try {
    const { records } = await server
      .transactions()
      .forAccount(data.account)
      .order("desc")
      .limit(data.limit)
      .call();

    // Only log if there are actual transactions
    if (records.length > 0) {
      console.log(`Found ${records.length} transactions for account ${data.account}`);
    }

    const transactions: Transaction[] = [];

    for (const [index, tx] of records.entries()) {
      try {
        const opResult = await server.operations().forTransaction(tx.id).call();
        const operation = opResult.records[0];

        let type: TransactionType = "send";
        let asset: string | undefined;
        let assetFrom: string | undefined;
        let assetTo: string | undefined;
        let amount: number | undefined;
        let amountFrom: number | undefined;
        let amountTo: number | undefined;
        let from: string | undefined;
        let to: string | undefined;

        switch (operation.type) {
          case "payment":
            type = operation.from === data.account ? "send" : "receive";
            asset =
              operation.asset_type === "native" ? "XLM" : operation.asset_code;
            amount = parseFloat(operation.amount);
            from = operation.from;
            to = operation.to;
            break;

          case "path_payment_strict_receive":
            type = "swap";
            assetFrom =
              operation.source_asset_type === "native"
                ? "XLM"
                : operation.source_asset_code;
            assetTo =
              operation.asset_type === "native" ? "XLM" : operation.asset_code;
            amountFrom = parseFloat(operation.source_amount);
            amountTo = parseFloat(operation.amount);
            from = operation.from;
            to = operation.to;
            break;

          case "path_payment_strict_send":
            type = "swap";
            assetFrom =
              operation.source_asset_type === "native"
                ? "XLM"
                : operation.source_asset_code;
            assetTo =
              operation.asset_type === "native" ? "XLM" : operation.asset_code;
            amountFrom = parseFloat(operation.source_amount);
            amountTo = parseFloat(operation.amount);
            from = operation.from;
            to = operation.to;
            break;

          case "create_account":
            type = "send";
            amount = parseFloat(operation.starting_balance);
            asset = "XLM";
            from = tx.source_account;
            to = operation.account;
            break;
        }

        const transaction: Transaction = {
          id: index + 1,
          type,
          asset,
          assetFrom,
          assetTo,
          amount: formatAmount(amount),
          amountFrom,
          amountTo,
          from,
          to,
          date: tx.created_at,
          status: tx.successful ? "completed" : "failed",
        };

        transactions.push(transaction);
      } catch (opError) {
        // Skip transactions that can't be processed
        console.warn(`Failed to process transaction ${tx.id}:`, opError);
        continue;
      }
    }

    return transactions;
  } catch (error) {
    console.warn('Failed to fetch transactions:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

const formatAmount = (amount?: number) => {
  if (amount === undefined) return "";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
};
