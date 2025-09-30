import { NextRequest, NextResponse } from 'next/server';
import { CryptoCompareResponse, ErrorResponse } from '@/types/api-responses';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fsyms = searchParams.get('fsyms');
    const tsyms = searchParams.get('tsyms') || 'USD';

    if (!fsyms) {
      const errorResponse: ErrorResponse = { error: 'Missing required parameter: fsyms' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const cryptocompareUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=${tsyms}`;

    const response = await fetch(cryptocompareUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Galaxy-Smart-Wallet/1.0'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`CryptoCompare API responded with status: ${response.status}`);
    }

    const data: CryptoCompareResponse = await response.json();

    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });

  } catch (error) {
    console.error('CryptoCompare proxy error:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to fetch data from CryptoCompare' };
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
