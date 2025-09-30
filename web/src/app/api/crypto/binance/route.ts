import { NextRequest, NextResponse } from 'next/server';
import { 
  BinanceTickerResponse, 
  CryptoPriceResponse, 
  ErrorResponse 
} from '@/types/api-responses';

// Mapping from our symbols to Binance symbols
const BINANCE_SYMBOL_MAP: { [key: string]: string } = {
  'XLM': 'XLMUSDT',
  'USDC': 'USDCUSDT',
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'ADA': 'ADAUSDT',
  'DOT': 'DOTUSDT',
  'LINK': 'LINKUSDT',
  'UNI': 'UNIUSDT',
  'MATIC': 'MATICUSDT',
  'SOL': 'SOLUSDT'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');

    if (!symbols) {
      const errorResponse: ErrorResponse = { error: 'Missing required parameter: symbols' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const symbolList = symbols.split(',');
    const binanceSymbols = symbolList
      .map(symbol => BINANCE_SYMBOL_MAP[symbol.toUpperCase()])
      .filter(Boolean);

    if (binanceSymbols.length === 0) {
      const errorResponse: ErrorResponse = { error: 'No valid symbols found' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get 24hr ticker statistics for all symbols
    const tickerUrl = 'https://api.binance.com/api/v3/ticker/24hr';
    
    const response = await fetch(tickerUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Galaxy-Smart-Wallet/1.0'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Binance API responded with status: ${response.status}`);
    }

    const allTickers: BinanceTickerResponse = await response.json();

    // Filter and format the data for our symbols
    const filteredData: CryptoPriceResponse = allTickers
      .filter((ticker) => binanceSymbols.includes(ticker.symbol))
      .reduce((acc, ticker) => {
        // Find the original symbol
        const originalSymbol = Object.keys(BINANCE_SYMBOL_MAP)
          .find(key => BINANCE_SYMBOL_MAP[key] === ticker.symbol);
        
        if (originalSymbol) {
          acc[originalSymbol] = {
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent)
          };
        }
        return acc;
      }, {} as CryptoPriceResponse);

    // Add CORS headers
    return NextResponse.json(filteredData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });

  } catch (error) {
    console.error('Binance proxy error:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to fetch data from Binance' };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
