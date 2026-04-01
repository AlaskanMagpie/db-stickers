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
 * A production deploy needs a server-side proxy or calls will be blocked by the browser.
 */

import type { EbaySale, PriceData } from '../types';

const EBAY_API_DIRECT = 'https://api.ebay.com';

function ebayApiOrigin(): string {
  return import.meta.env.DEV ? '/ebay-api' : EBAY_API_DIRECT;
}

export interface EbaySearchResult {
  title: string;
  price: number;
  currency: string;
  condition: string;
  imageUrl?: string;
  itemUrl: string;
  endDate: string;
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
      limit: '20',
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
          prompt: 'Extract all sold listing items with their title, sold price (just the number), date sold, condition, image URL, and item URL.',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl error: ${response.status}`);
    }

    const data = await response.json();
    const listings = data?.data?.extract?.listings || [];

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
 * Calculate price data from search results
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

  const recentSales: EbaySale[] = results.slice(0, 10).map((r) => ({
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
  // Try eBay API first
  if (ebayKey) {
    const results = await searchEbayAPI(query, ebayKey);
    if (results.length > 0) {
      return calculatePriceData(results, 'ebay_api');
    }
  }

  // Fallback to Firecrawl
  if (firecrawlKey) {
    const results = await searchEbayFirecrawl(query, firecrawlKey);
    if (results.length > 0) {
      return calculatePriceData(results, 'firecrawl');
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchAllPricesOptions {
  /** Space out requests to reduce rate-limit risk (ms between stickers). */
  delayMs?: number;
  signal?: AbortSignal;
  onProgress?: (p: { completed: number; total: number; currentId: string }) => void;
  onEach?: (stickerId: string, data: PriceData | null) => void;
}

/**
 * Sequentially fetch market data for every sticker. Only successful fetches should
 * be written to the store (callers typically ignore null results).
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
  const total = stickers.length;
  const signal = options?.signal;

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const s = stickers[i];
    options?.onProgress?.({ completed: i, total, currentId: s.id });

    const data = await fetchStickerPrice(s.ebaySearchQuery, ebayKey, firecrawlKey);
    options?.onEach?.(s.id, data);
    options?.onProgress?.({ completed: i + 1, total, currentId: s.id });

    if (i < total - 1) await sleep(delayMs);
  }
}
