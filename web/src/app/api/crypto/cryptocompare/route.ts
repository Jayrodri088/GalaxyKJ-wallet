import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fsyms = searchParams.get('fsyms');
    const tsyms = searchParams.get('tsyms') || 'USD';

    if (!fsyms) {
      return NextResponse.json(
        { error: 'Missing required parameter: fsyms' },
        { status: 400 }
      );
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

    const data = await response.json();

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
    return NextResponse.json(
      { error: 'Failed to fetch data from CryptoCompare' },
      { status: 500 }
    );
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
