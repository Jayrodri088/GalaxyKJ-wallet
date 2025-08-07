import { useState, useEffect, useCallback } from "react";
import {
  stellarConversionService,
  ConversionEstimate,
  ConversionResult,
  TrustlineInfo,
  STELLAR_ASSETS
} from "@/lib/stellar/conversion-service";

export interface ConversionState {
  loading: boolean;
  error: string | null;
  estimate: ConversionEstimate | null;
  result: ConversionResult | null;
  trustlines: {
    source: TrustlineInfo | null;
    destination: TrustlineInfo | null;
  };
  orderBook: {
    bids: Array<{ price: string; amount: string }>;
    asks: Array<{ price: string; amount: string }>;
  } | null;
}

export function useStellarConversion(sourceSecret?: string) {
  const [state, setState] = useState<ConversionState>({
    loading: false,
    error: null,
    estimate: null,
    result: null,
    trustlines: {
      source: null,
      destination: null
    },
    orderBook: null
  });

  const updateState = useCallback((updates: Partial<ConversionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearResult = useCallback(() => {
    updateState({ result: null });
  }, [updateState]);

  // Get exchange rate estimate
  const getEstimate = useCallback(async (
    fromAssetId: string,
    toAssetId: string,
    amount: string
  ) => {
    if (!amount || parseFloat(amount) <= 0) {
      updateState({ estimate: null, error: null });
      return;
    }

    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      updateState({ error: "Invalid asset selection" });
      return;
    }

    updateState({ loading: true, error: null });

    try {
      const estimate = await stellarConversionService.estimateConversion(
        sourceAsset,
        destinationAsset,
        amount
      );

      updateState({ 
        loading: false, 
        estimate,
        error: estimate ? null : "No conversion path available"
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to get conversion estimate";
      updateState({ 
        loading: false, 
        error: message,
        estimate: null 
      });
    }
  }, [updateState]);

  // Check trustlines for both assets
  const checkTrustlines = useCallback(async (
    accountPublicKey: string,
    fromAssetId: string,
    toAssetId: string
  ) => {
    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      return;
    }

    updateState({ loading: true });

    try {
      const [sourceTrustline, destTrustline] = await Promise.all([
        stellarConversionService.checkTrustline(accountPublicKey, sourceAsset),
        stellarConversionService.checkTrustline(accountPublicKey, destinationAsset)
      ]);

      updateState({
        loading: false,
        trustlines: {
          source: sourceTrustline,
          destination: destTrustline
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to check trustlines";
      updateState({ 
        loading: false, 
        error: message
      });
    }
  }, [updateState]);

  // Get order book data for live rates
  const fetchOrderBook = useCallback(async (
    fromAssetId: string,
    toAssetId: string
  ) => {
    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      return;
    }

    try {
      const orderBook = await stellarConversionService.getOrderBook(
        sourceAsset,
        destinationAsset,
        10
      );

      updateState({ orderBook });
    } catch (error: unknown) {
      console.error("Failed to fetch order book:", error);
    }
  }, [updateState]);

  // Execute the conversion
  const executeConversion = useCallback(async (
    fromAssetId: string,
    toAssetId: string,
    amount: string,
    destinationAddress?: string,
    memo?: string
  ) => {
    if (!sourceSecret) {
      updateState({ error: "Wallet not connected" });
      return;
    }

    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset || !state.estimate) {
      updateState({ error: "Invalid conversion parameters" });
      return;
    }

    updateState({ loading: true, error: null, result: null });

    try {
      // Use 95% of estimated amount as minimum to account for slippage
      const destinationMin = (parseFloat(state.estimate.destinationAmount) * 0.95).toFixed(7);

      const result = await stellarConversionService.executeConversion(
        sourceSecret,
        sourceAsset,
        destinationAsset,
        amount,
        destinationMin,
        destinationAddress,
        memo
      );

      updateState({ loading: false, result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Conversion failed";
      updateState({ 
        loading: false, 
        error: message,
        result: { success: false, error: message }
      });
    }
  }, [sourceSecret, state.estimate, updateState]);

  // Auto-refresh order book data
  useEffect(() => {
    const refreshData = async () => {
      if (!state.loading && state.estimate) {
        // Refresh order book data periodically
        const fromAssetId = Object.keys(STELLAR_ASSETS)[0]; // Default refresh
        const toAssetId = Object.keys(STELLAR_ASSETS)[1];
        await fetchOrderBook(fromAssetId, toAssetId);
      }
    };

    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [state.estimate, state.loading, fetchOrderBook]);

  return {
    ...state,
    getEstimate,
    checkTrustlines,
    fetchOrderBook,
    executeConversion,
    clearError,
    clearResult,
    assets: STELLAR_ASSETS
  };
}