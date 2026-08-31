import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/geolocation?ip=x.x.x.x
 *
 * Uses ipapi.co (1,000 free requests/day, no API key needed) to resolve
 * an IP address to city, region, country, and coordinates.
 * If no IP is provided, resolves the caller's own IP.
 */

interface GeoResult {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  org: string;
  timezone: string;
}

// Simple in-memory cache to avoid burning free quota on repeat lookups
const cache = new Map<string, { data: GeoResult; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');

  const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
  const cacheKey = ip || '__self__';

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ASRMS-Platform/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Geolocation lookup failed', status: res.status },
        { status: 502 },
      );
    }

    const data: GeoResult = await res.json();

    // Cache successful results
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });

    return NextResponse.json({ ...data, cached: false });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Geolocation service unreachable' },
      { status: 502 },
    );
  }
}
