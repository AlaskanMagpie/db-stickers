import type { EbaySearchResult } from '../types';

/** Target number of comps for low/median/high (all must pass bulk heuristics). */
const DEFAULT_MAX_SAMPLES = 5;

/**
 * Heuristic: sold listing title suggests multiple stickers / picker / bundle (not a 1:1 comp).
 */
export function isLikelyBulkListing(title: string): boolean {
  const t = title.toLowerCase();

  const lotOf = t.match(/\blot\s+of\s+(\d+)\b/i);
  if (lotOf && parseInt(lotOf[1], 10) >= 2) return true;

  if (/\blots?\s+of\s+(\d{2,})\b/i.test(t)) return true;
  if (/\b\d+\s*[-+]\s*(\d+\s*)?(sticker|stickers|merch|pins?)\b/i.test(t)) return true;
  if (/\b(you|u)\s*pick\b/i.test(t)) return true;
  if (/\bpick\s+(any|\d+|your)\b/i.test(t)) return true;
  if (/\b(assorted|mixed)\s+(lot|bundle|pack|stickers?)\b/i.test(t)) return true;
  if (/\bvariety\s+(pack|lot|bundle)\b/i.test(t)) return true;
  if (/\bgrab\s+bag\b/i.test(t)) return true;
  if (/\bmerch\s+sampler\b/i.test(t)) return true;
  if (/\bsampler\b/i.test(t) && /\bsticker/i.test(t)) return true;
  if (/\bbulk\b/i.test(t) && /\bsticker/i.test(t)) return true;
  if (/\bbundle\b/i.test(t) && /\d/.test(t)) return true;
  if (/\bset\s+of\s+([2-9]|\d{2,})\b/i.test(t)) return true;
  if (/\b([2-9]|\d{2,})\s+stickers?\b/i.test(t)) return true;
  if (/\b\d+\s*x\s*sticker/i.test(t)) return true;
  if (/\+\s*\d+\s*sticker/i.test(t)) return true;
  if (/\bsticker\s+lot\b/i.test(t) && /\d/.test(t)) return true;

  return false;
}

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((w) => w.length > 2 && !['dutch', 'bros', 'bro', 'sticker', 'stickers'].includes(w));
}

/**
 * Higher = more likely a single-unit comp. Used to rank within non-bulk and soft fallback.
 */
export function singleStickerCompScore(title: string, searchQuery: string): number {
  const t = title.toLowerCase();
  let score = 50;

  if (isLikelyBulkListing(title)) score -= 45;

  if (/\bsingle\b/i.test(t) || /\bone\s*\(?1\)?\s*sticker/i.test(t) || /\b1\s*sticker\b/i.test(t)) {
    score += 25;
  }

  for (const w of tokenizeQuery(searchQuery)) {
    if (t.includes(w)) score += 6;
  }

  if (/\bonly\b|\bjust\s+the\b|\bone\s+only\b/i.test(t)) score += 8;

  score = Math.max(0, Math.min(100, score));
  return score;
}

export interface PickCompsOptions {
  searchQuery: string;
  /** Default 5 — evaluate up to this many **single-sticker** rows for stats. */
  maxSamples?: number;
}

/**
 * From raw eBay rows (page/API order ≈ newest first), keep up to `maxSamples` listings that
 * do **not** look like lots/bundles, ranked by how well they match a single-unit comp for `searchQuery`.
 * If none qualify, returns [] (caller should treat as no reliable comps).
 */
export function pickSingleStickerComps(
  results: EbaySearchResult[],
  options: PickCompsOptions,
): EbaySearchResult[] {
  const maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES;
  const q = options.searchQuery;

  if (results.length === 0) return [];

  const indexed = results.map((r, i) => ({
    r,
    i,
    bulk: isLikelyBulkListing(r.title),
    score: singleStickerCompScore(r.title, q),
  }));

  const nonBulk = indexed.filter((x) => !x.bulk);
  const rankedNonBulk = [...nonBulk].sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.r);

  return rankedNonBulk.slice(0, maxSamples);
}
