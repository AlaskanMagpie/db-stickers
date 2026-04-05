/**
 * eBay API Service
 *
 * Supports two modes:
 * 1. eBay Browse API (requires API key) — searches completed/sold listings
 * 2. Firecrawl scraping fallback — scrapes eBay sold listings pages
 *
 * To get an eBay API key:
 * 1. Go to https://developer.ebay.com
 * 2. Create an application (Production keys)
 * 3. Generate an OAuth token with Browse API scope
 *
 * Environment variables:
 * VITE_EBAY_API_KEY — eBay OAuth token
 * VITE_FIRECRAWL_API_KEY — Firecrawl API key
 *
 * Localhost: Vite proxies `/ebay-api` → `api.ebay.com` so the Browse API works without CORS errors.
 * Firecrawl is called directly from the browser (`api.firecrawl.dev` allows CORS). No deploy required for pricing.
 * A production deploy still needs a server-side eBay proxy or Browse calls will be CORS-blocked.
 */

import type { EbaySale, EbaySearchResult, PriceData } from '../types';
import { pickSingleStickerComps } from './listingCompFilter';

export type { EbaySearchResult };

const EBAY_API_DIRECT = 'https://api.ebay.com';

function ebayApiOrigin(): string {
  return import.meta.env.DEV ? '/ebay-api' : EBAY_API_DIRECT;
}

/**
 * Search eBay completed listings using the Browse API
 */
export async function searchEbayAPI(
  query: string,
  apiKey: string,
): Promise<EbaySearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION},conditionIds:{1000|1500|2000|2500|3000}',
      sort: '-endDate',
      limit: '30',
    });

    const response = await fetch(
      `${ebayApiOrigin()}/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.itemSummaries || []).map((item: any) => ({
      title: item.title,
      price: parseFloat(item.price?.value || '0'),
      currency: item.price?.currency || 'USD',
      condition: item.condition || 'Unknown',
      imageUrl: item.thumbnailImages?.[0]?.imageUrl,
      itemUrl: item.itemWebUrl,
      endDate: item.itemEndDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('eBay API search failed:', error);
    return [];
  }
}

/**
 * Search eBay sold listings via Firecrawl scraping
 */
export async function searchEbayFirecrawl(
  query: string,
  firecrawlKey: string,
): Promise<EbaySearchResult[]> {
  try {
    const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sop=13`;

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: ebayUrl,
        formats: ['extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              listings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    price: { type: 'string' },
                    date_sold: { type: 'string' },
                    condition: { type: 'string' },
                    image_url: { type: 'string' },
                    item_url: { type: 'string' },
                  },
                },
              },
            },
          },
          prompt:
            'Extract up to 25 sold/completed listing rows from this eBay results page, in visible order (newest first). ' +
            'For each row include: title, sold price (number only), date sold, condition, image URL, item URL. ' +
            'Include every distinct listing you can see — we will filter for single-sticker sales downstream.',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg =
        typeof data?.error === 'string'
          ? data.error
          : `HTTP ${response.status}`;
      console.error('Firecrawl scrape failed:', msg, data);
      return [];
    }

    if (data?.success === false) {
      console.error('Firecrawl scrape failed:', data?.error || data);
      return [];
    }

    const listings = data?.data?.extract?.listings || [];
    if (listings.length === 0 && data?.data?.warning) {
      console.warn('Firecrawl warning:', data.data.warning);
    }

    return listings.map((item: any) => ({
      title: item.title || '',
      price: parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')),
      currency: 'USD',
      condition: item.condition || 'Unknown',
      imageUrl: item.image_url,
      itemUrl: item.item_url || ebayUrl,
      endDate: item.date_sold || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Firecrawl eBay scrape failed:', error);
    return [];
  }
}

/**
 * Calculate low/median/high and thumbnails from **already-filtered** single-sticker comps
 * (typically 3–5 rows from `pickSingleStickerComps`).
 */
export function calculatePriceData(
  results: EbaySearchResult[],
  source: PriceData['source'],
): PriceData {
  if (results.length === 0) {
    return {
      low: 0,
      median: 0,
      high: 0,
      lastUpdated: new Date().toISOString(),
      recentSales: [],
      source,
    };
  }

  const prices = results.map((r) => r.price).filter((p) => p > 0).sort((a, b) => a - b);

  const low = prices[0] || 0;
  const high = prices[prices.length - 1] || 0;
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  const recentSales: EbaySale[] = results.slice(0, 8).map((r) => ({
    title: r.title,
    price: r.price,
    date: r.endDate,
    condition: r.condition,
    url: r.itemUrl,
    imageUrl: r.imageUrl,
  }));

  const thumbnailUrl = results.find((r) => r.imageUrl)?.imageUrl;

  return {
    low: Math.round(low * 100) / 100,
    median: Math.round(median * 100) / 100,
    high: Math.round(high * 100) / 100,
    lastUpdated: new Date().toISOString(),
    recentSales,
    source,
    thumbnailUrl,
  };
}

/**
 * Search for sticker prices using best available method
 */
export async function fetchStickerPrice(
  query: string,
  ebayKey?: string,
  firecrawlKey?: string,
): Promise<PriceData | null> {
  const pick = (raw: EbaySearchResult[]) =>
    pickSingleStickerComps(raw, { searchQuery: query, maxSamples: 5 });

  // Prefer Firecrawl when configured — sold listing page (comps). Browse API is active asks.
  if (firecrawlKey) {
    const raw = await searchEbayFirecrawl(query, firecrawlKey);
    const comps = pick(raw);
    if (comps.length > 0) {
      return calculatePriceData(comps, 'firecrawl');
    }
  }

  if (ebayKey) {
    const raw = await searchEbayAPI(query, ebayKey);
    const comps = pick(raw);
    if (comps.length > 0) {
      return calculatePriceData(comps, 'ebay_api');
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchAllPricesOptions {
  /** Space out requests to reduce rate-limit risk (ms after each finished sticker, per worker). */
  delayMs?: number;
  /** In-flight fetches at once. Firecrawl is ~30–60s each; sequential is very slow — default 5. */
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (p: { completed: number; total: number; currentId: string }) => void;
  onEach?: (stickerId: string, data: PriceData | null) => void;
}

/**
 * Fetch market data for every sticker with bounded parallelism. Successful fetches
 * are passed to `onEach`; null means no comps (callers often skip persisting).
 *
 * eBay Browse API returns **active** listings (asking prices). Firecrawl uses **sold**
 * listing pages when configured — often closer to “comps.”
 */
export async function fetchAllStickerPrices(
  stickers: Array<{ id: string; ebaySearchQuery: string }>,
  ebayKey: string | undefined,
  firecrawlKey: string | undefined,
  options?: FetchAllPricesOptions,
): Promise<void> {
  const delayMs = options?.delayMs ?? 500;
  const rawConcurrency = options?.concurrency ?? 5;
  const concurrency = Math.max(1, Math.min(20, rawConcurrency));
  const total = stickers.length;
  const signal = options?.signal;

  if (total === 0) return;

  let nextIndex = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const i = nextIndex++;
      if (i >= total) return;

      const s = stickers[i];
      const data = await fetchStickerPrice(s.ebaySearchQuery, ebayKey, firecrawlKey);
      options?.onEach?.(s.id, data);
      completed += 1;
      options?.onProgress?.({ completed, total, currentId: s.id });

      if (delayMs > 0) await sleep(delayMs);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}
