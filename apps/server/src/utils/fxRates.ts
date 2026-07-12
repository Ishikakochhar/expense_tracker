/**
 * fxRates.ts — Live FX rate fetching utility
 *
 * Fetches the current USD → INR exchange rate from the open.er-api.com
 * free API (no key required, 1500 req/month).
 * Falls back to a hardcoded rate of 83.5 if the API is unreachable.
 */

const FALLBACK_USD_TO_INR = 83.5;

// In-memory cache: avoids hammering the API on every import row
let cachedRate: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getUsdToInrRate(): Promise<number> {
  const now = Date.now();

  if (cachedRate !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRate;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) throw new Error(`FX API returned ${response.status}`);

    const data = await response.json() as { rates?: { INR?: number } };
    const rate = data?.rates?.INR;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid rate in FX API response');
    }

    cachedRate = rate;
    cacheTimestamp = now;
    console.log(`[FX] Fetched live USD→INR rate: ${rate}`);
    return rate;
  } catch (err) {
    console.warn(`[FX] Failed to fetch live rate, using fallback ${FALLBACK_USD_TO_INR}:`, err);
    return FALLBACK_USD_TO_INR;
  }
}
