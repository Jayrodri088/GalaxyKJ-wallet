import { useState, useEffect, useRef } from 'react';

export interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  color: string;
  gradient: string;
  letter: string;
}

interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

interface CryptoCompareResponse {
  RAW: {
    [key: string]: {
      USD: {
        PRICE: number;
        CHANGEPCT24HOUR: number;
      };
    };
  };
}

interface BinanceResponse {
  [key: string]: {
    price: number;
    change24h: number;
  };
}

// API Configuration - using internal proxy routes
const API_CONFIG = {
  coingecko: {
    baseUrl: '/api/crypto/coingecko',
    timeout: 10000
  },
  cryptocompare: {
    baseUrl: '/api/crypto/cryptocompare',
    timeout: 10000
  },
  binance: {
    baseUrl: '/api/crypto/binance',
    timeout: 10000
  }
};

// Crypto IDs mapping for different APIs
const CRYPTO_IDS = {
  xlm: {
    coingecko: 'stellar',
    cryptocompare: 'XLM',
    name: 'Stellar Lumens',
    symbol: 'XLM',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
    letter: 'X'
  },
  usdc: {
    coingecko: 'usd-coin',
    cryptocompare: 'USDC',
    name: 'USD Coin',
    symbol: 'USDC',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
    letter: 'U'
  },
  btc: {
    coingecko: 'bitcoin',
    cryptocompare: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: 'bg-purple-600',
    gradient: 'from-purple-600 to-yellow-500',
    letter: 'B'
  },
  eth: {
    coingecko: 'ethereum',
    cryptocompare: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    color: 'bg-blue-600',
    gradient: 'from-blue-600 to-blue-400',
    letter: 'E'
  },
  ada: {
    coingecko: 'cardano',
    cryptocompare: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    letter: 'A'
  },
  dot: {
    coingecko: 'polkadot',
    cryptocompare: 'DOT',
    name: 'Polkadot',
    symbol: 'DOT',
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-purple-600',
    letter: 'D'
  },
  link: {
    coingecko: 'chainlink',
    cryptocompare: 'LINK',
    name: 'Chainlink',
    symbol: 'LINK',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    letter: 'L'
  },
  uni: {
    coingecko: 'uniswap',
    cryptocompare: 'UNI',
    name: 'Uniswap',
    symbol: 'UNI',
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-red-500',
    letter: 'U'
  },
  matic: {
    coingecko: 'matic-network',
    cryptocompare: 'MATIC',
    name: 'Polygon',
    symbol: 'MATIC',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    letter: 'M'
  },
  sol: {
    coingecko: 'solana',
    cryptocompare: 'SOL',
    name: 'Solana',
    symbol: 'SOL',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    letter: 'S'
  }
};

// Cache for storing prices temporarily
const priceCache = new Map<string, { price: number; change24h: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to make API requests with timeout and CORS handling
const makeApiRequest = async (url: string, timeout: number = 8000): Promise<any> => {
  // First try with fetch (might work in some environments)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (fetchError) {
    console.log('Fetch failed, trying XMLHttpRequest:', fetchError);
    
    // Fallback to XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = timeout;
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      
      xhr.send();
    });
  }
};

// Fetch prices from CoinGecko API via internal proxy
const fetchFromCoinGecko = async (): Promise<CryptoPrice[] | null> => {
  try {
    const ids = Object.values(CRYPTO_IDS).map(crypto => crypto.coingecko).join(',');
    const url = `${API_CONFIG.coingecko.baseUrl}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    const data: CoinGeckoResponse = await makeApiRequest(url, API_CONFIG.coingecko.timeout);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return Object.entries(CRYPTO_IDS).map(([key, crypto]) => {
      const priceData = data[crypto.coingecko];
      if (!priceData || priceData.usd === undefined) {
        return null;
      }
      return {
        id: key,
        name: crypto.name,
        symbol: crypto.symbol,
        price: priceData.usd,
        change24h: priceData.usd_24h_change || 0,
        color: crypto.color,
        gradient: crypto.gradient,
        letter: crypto.letter
      };
    }).filter(Boolean) as CryptoPrice[];
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return null;
  }
};

// Fetch prices from CryptoCompare API via internal proxy
const fetchFromCryptoCompare = async (): Promise<CryptoPrice[] | null> => {
  try {
    const symbols = Object.values(CRYPTO_IDS).map(crypto => crypto.cryptocompare).join(',');
    const url = `${API_CONFIG.cryptocompare.baseUrl}?fsyms=${symbols}&tsyms=USD`;
    
    const data: CryptoCompareResponse = await makeApiRequest(url, API_CONFIG.cryptocompare.timeout);
    
    if (!data || !data.RAW) {
      return null;
    }

    return Object.entries(CRYPTO_IDS).map(([key, crypto]) => {
      const priceData = data.RAW[crypto.cryptocompare]?.USD;
      if (!priceData || priceData.PRICE === undefined) {
        return null;
      }
      return {
        id: key,
        name: crypto.name,
        symbol: crypto.symbol,
        price: priceData.PRICE,
        change24h: priceData.CHANGEPCT24HOUR || 0,
        color: crypto.color,
        gradient: crypto.gradient,
        letter: crypto.letter
      };
    }).filter(Boolean) as CryptoPrice[];
  } catch (error) {
    console.error('CryptoCompare API error:', error);
    return null;
  }
};

// Fetch prices from Binance API via internal proxy
const fetchFromBinance = async (): Promise<CryptoPrice[] | null> => {
  try {
    const symbols = Object.values(CRYPTO_IDS).map(crypto => crypto.symbol).join(',');
    const url = `${API_CONFIG.binance.baseUrl}?symbols=${symbols}`;
    
    const data: BinanceResponse = await makeApiRequest(url, API_CONFIG.binance.timeout);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return Object.entries(CRYPTO_IDS).map(([key, crypto]) => {
      const priceData = data[crypto.symbol];
      if (!priceData || priceData.price === undefined) {
        return null;
      }
      return {
        id: key,
        name: crypto.name,
        symbol: crypto.symbol,
        price: priceData.price,
        change24h: priceData.change24h || 0,
        color: crypto.color,
        gradient: crypto.gradient,
        letter: crypto.letter
      };
    }).filter(Boolean) as CryptoPrice[];
  } catch (error) {
    console.error('Binance API error:', error);
    return null;
  }
};

// Get cached price if available and not expired
const getCachedPrice = (symbol: string): { price: number; change24h: number } | null => {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
};

// Cache price data
const cachePrice = (symbol: string, price: number, change24h: number) => {
  priceCache.set(symbol, { price, change24h, timestamp: Date.now() });
};

// Create empty prices array when no data is available
const createEmptyPrices = (): CryptoPrice[] => {
  return Object.entries(CRYPTO_IDS).map(([key, crypto]) => ({
    id: key,
    name: crypto.name,
    symbol: crypto.symbol,
    price: 0,
    change24h: 0,
    color: crypto.color,
    gradient: crypto.gradient,
    letter: crypto.letter
  }));
};

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'coingecko' | 'cryptocompare' | 'binance' | 'cache' | 'none'>('none');
  const retryCount = useRef(0);
  const maxRetries = 2;

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try CoinGecko first
      console.log('Attempting to fetch from CoinGecko...');
      const coingeckoPrices = await fetchFromCoinGecko();
      if (coingeckoPrices && coingeckoPrices.length > 0 && coingeckoPrices.some(p => p.price > 0)) {
        console.log('CoinGecko success:', coingeckoPrices.length, 'prices');
        setPrices(coingeckoPrices);
        setLastUpdated(new Date());
        setDataSource('coingecko');
        setError(null);
        retryCount.current = 0;
        
        // Cache the prices
        coingeckoPrices.forEach(price => {
          cachePrice(price.symbol, price.price, price.change24h);
        });
        
        setLoading(false);
        return;
      }

      // Try CryptoCompare as fallback
      console.log('Attempting to fetch from CryptoCompare...');
      const cryptocomparePrices = await fetchFromCryptoCompare();
      if (cryptocomparePrices && cryptocomparePrices.length > 0 && cryptocomparePrices.some(p => p.price > 0)) {
        console.log('CryptoCompare success:', cryptocomparePrices.length, 'prices');
        setPrices(cryptocomparePrices);
        setLastUpdated(new Date());
        setDataSource('cryptocompare');
        setError(null);
        retryCount.current = 0;
        
        // Cache the prices
        cryptocomparePrices.forEach(price => {
          cachePrice(price.symbol, price.price, price.change24h);
        });
        
        setLoading(false);
        return;
      }

      // Try Binance as third fallback
      console.log('Attempting to fetch from Binance...');
      const binancePrices = await fetchFromBinance();
      if (binancePrices && binancePrices.length > 0 && binancePrices.some(p => p.price > 0)) {
        console.log('Binance success:', binancePrices.length, 'prices');
        setPrices(binancePrices);
        setLastUpdated(new Date());
        setDataSource('binance');
        setError(null);
        retryCount.current = 0;
        
        // Cache the prices
        binancePrices.forEach(price => {
          cachePrice(price.symbol, price.price, price.change24h);
        });
        
        setLoading(false);
        return;
      }

      // Use cached prices as final fallback
      console.log('Attempting to use cached prices...');
      const cachedPrices: CryptoPrice[] = Object.entries(CRYPTO_IDS).map(([key, crypto]) => {
        const cached = getCachedPrice(crypto.symbol);
        return {
          id: key,
          name: crypto.name,
          symbol: crypto.symbol,
          price: cached?.price || 0,
          change24h: cached?.change24h || 0,
          color: crypto.color,
          gradient: crypto.gradient,
          letter: crypto.letter
        };
      });

      if (cachedPrices.some(p => p.price > 0)) {
        console.log('Using cached prices:', cachedPrices.filter(p => p.price > 0).length, 'cached');
        setPrices(cachedPrices);
        setDataSource('cache');
        setError('Using cached prices - All APIs temporarily unavailable');
      } else {
        console.log('No data available from any source');
        setPrices(createEmptyPrices());
        setDataSource('none');
        setError('Unable to fetch prices from any source. Please check your internet connection.');
      }
      
    } catch (err) {
      console.error('Error in fetchPrices:', err);
      setError('Failed to load prices');
      setPrices(createEmptyPrices());
      setDataSource('none');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Refresh prices every 60 seconds
    const interval = setInterval(fetchPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  const getPrice = (symbol: string): number => {
    const crypto = prices.find(p => p.symbol.toLowerCase() === symbol.toLowerCase());
    return crypto?.price || 0;
  };

  const getChange24h = (symbol: string): number => {
    const crypto = prices.find(p => p.symbol.toLowerCase() === symbol.toLowerCase());
    return crypto?.change24h || 0;
  };

  const refreshPrices = () => {
    retryCount.current = 0;
    fetchPrices();
  };

  const retryWithDelay = () => {
    retryCount.current = 0;
    setTimeout(() => {
      fetchPrices();
    }, 2000);
  };

  return {
    prices,
    loading,
    error,
    lastUpdated,
    dataSource,
    getPrice,
    getChange24h,
    refreshPrices,
    retryWithDelay
  };
}
