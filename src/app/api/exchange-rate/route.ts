import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exchange-rate?from=USD&to=PKR
 *
 * Uses the free ExchangeRate-API (https://open.er-api.com) to fetch
 * live currency conversion rates. No API key required for the open endpoint.
 */

// Cache exchange rates for 1 hour to stay well within free tier limits
const cache = new Map<string, { rate: number; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get('from') || 'USD').toUpperCase();
  const to = (searchParams.get('to') || 'PKR').toUpperCase();
  const amount = parseFloat(searchParams.get('amount') || '1');

  const cacheKey = `${from}_${to}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({
      from,
      to,
      rate: cached.rate,
      amount,
      converted: Math.round(amount * cached.rate * 100) / 100,
      cached: true,
      source: 'ExchangeRate-API (Cached)',
    });
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Exchange rate API returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();

    if (data.result !== 'success' || !data.rates?.[to]) {
      return NextResponse.json(
        { error: `Currency pair ${from}/${to} not available` },
        { status: 400 },
      );
    }

    const rate: number = data.rates[to];
    cache.set(cacheKey, { rate, expires: Date.now() + CACHE_TTL });

    return NextResponse.json({
      from,
      to,
      rate,
      amount,
      converted: Math.round(amount * rate * 100) / 100,
      cached: false,
      source: 'ExchangeRate-API (Live)',
      lastUpdated: data.time_last_update_utc,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Exchange rate service unreachable' },
      { status: 502 },
    );
  }
}
