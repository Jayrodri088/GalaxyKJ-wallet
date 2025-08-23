import { WalletAccount, WalletBalance, WalletTransaction } from "@/types/wallet";

class StellarService {
  private horizonUrl: string = '';

  async initialize(horizonUrl: string): Promise<void> {
    try {
      this.horizonUrl = horizonUrl;
    } catch (error) {
      console.error('❌ Failed to initialize Stellar service:', error);
      throw new Error('Failed to initialize Stellar service');
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.horizonUrl}${endpoint}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async loadAccount(publicKey: string): Promise<WalletAccount> {
    if (!this.horizonUrl) {
      throw new Error('Stellar service not initialized');
    }

    const accountResponse = await this.makeRequest(`/accounts/${publicKey}`);

    return {
      publicKey: accountResponse.id,
      sequence: accountResponse.sequence,
      subentry_count: accountResponse.subentry_count,
      home_domain: accountResponse.home_domain,
      inflation_destination: accountResponse.inflation_destination,
      last_modified_ledger: accountResponse.last_modified_ledger,
      last_modified_time: accountResponse.last_modified_time,
      thresholds: {
        low_threshold: accountResponse.thresholds.low_threshold,
        med_threshold: accountResponse.thresholds.med_threshold,
        high_threshold: accountResponse.thresholds.high_threshold,
      },
      flags: {
        auth_required: accountResponse.flags.auth_required,
        auth_revocable: accountResponse.flags.auth_revocable,
        auth_immutable: accountResponse.flags.auth_immutable,
        auth_clawback_enabled: accountResponse.flags.auth_clawback_enabled,
      },
      signers: accountResponse.signers.map((signer: any) => ({
        weight: signer.weight,
        key: signer.key,
        type: signer.type,
      })),
      data: accountResponse.data_attr,
    };
  }

  async getAccountResponse(publicKey: string): Promise<any> {
    if (!this.horizonUrl) {
      throw new Error('Stellar service not initialized');
    }

    return await this.makeRequest(`/accounts/${publicKey}`);
  }

  async loadBalance(accountResponse: any): Promise<WalletBalance> {
    const xlmBalance = accountResponse.balances.find(
      (balance: any) => balance.asset_type === 'native'
    );

    const assetBalances = accountResponse.balances
      .filter((balance: any) => balance.asset_type !== 'native')
      .map((balance: any) => ({
        asset: {
          code: balance.asset_code,
          issuer: balance.asset_issuer,
          isNative: () => false,
          getCode: () => balance.asset_code,
          getIssuer: () => balance.asset_issuer,
        },
        balance: balance.balance,
        buying_liabilities: balance.buying_liabilities,
        selling_liabilities: balance.selling_liabilities,
        authorized: balance.is_authorized || false,
        last_modified_ledger: balance.last_modified_ledger || 0,
      }));

    return {
      xlm: {
        balance: xlmBalance?.balance || '0',
        buying_liabilities: xlmBalance?.buying_liabilities || '0',
        selling_liabilities: xlmBalance?.selling_liabilities || '0',
      },
      assets: assetBalances,
      totalXLMValue: xlmBalance?.balance || '0',
    };
  }

  async loadTransactions(publicKey: string): Promise<WalletTransaction[]> {
    if (!this.horizonUrl) {
      throw new Error('Stellar service not initialized');
    }

    const transactionResponse = await this.makeRequest(`/accounts/${publicKey}/transactions?order=desc&limit=50`);

    const transactions: WalletTransaction[] = transactionResponse._embedded.records.map((record: any) => ({
      id: record.id,
      hash: record.hash,
      type: 'other' as const,
      amount: record.fee_charged,
      asset: 'XLM',
      from: record.source_account,
      to: record.source_account,
      timestamp: new Date(record.created_at),
      fee: record.fee_charged,
      successful: record.successful,
      memo: record.memo,
    }));

    return transactions;
  }
}

// Export a singleton instance
export const stellarService = new StellarService();
