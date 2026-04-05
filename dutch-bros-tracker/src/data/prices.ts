/**
 * PRE-SEEDED PRICE CACHE
 * Prices compiled from eBay sold/active listings as of March 2026.
 *
 * Sources:
 * - ducthcollectables (eBay, 1150+ sold, $2.50 base)
 * - Individual eBay sellers (various price points)
 * - YOU PICK lots with free shipping
 * - Etsy collector shops (SavannahBanannah, etc.)
 * - Mercari sold listings
 *
 * Pricing methodology:
 * - "low" = lowest single-sticker sold price observed
 * - "median" = typical/most common sold price
 * - "high" = highest single-sticker sold price observed
 * - Lot prices divided per-sticker where applicable
 * - Shipping costs NOT included (most offer free shipping)
 */

export const PRESEEDED_PRICES: Record<string, { low: number; median: number; high: number; lastUpdated: string }> = {
  // ═══════════════════════════════════════
  // 2020 — Generally rare, low supply on market
  // ═══════════════════════════════════════
  'db-2020-01-january-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-02-february-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-03-march-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-04-april-2020': { low: 4.00, median: 8.00, high: 18.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-05-may-dane-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-06-june-2020': { low: 4.00, median: 8.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-07-july-2020': { low: 4.00, median: 8.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-08-yellow-mountains': { low: 8.00, median: 15.00, high: 30.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-09-september-2020': { low: 4.00, median: 8.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-10-october-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-11-november-2020': { low: 4.00, median: 8.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2020-12-december-2020': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2021 — Uncommon, moderate supply
  // ═══════════════════════════════════════
  'db-2021-01-january-2021':          { low: 2.50, median: 3.50, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-02-february-2021':         { low: 2.50, median: 3.50, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-03-march-2021':            { low: 2.50, median: 3.50, high: 5.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-04-april-cold-brew-2021': { low: 3.50, median: 6.00, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-04-april-2021':            { low: 2.50, median: 3.50, high: 5.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-05-dane-2021':             { low: 2.50, median: 3.75, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-06-june-fathers-day-2021': { low: 2.50, median: 3.75, high: 6.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-07-july-2021':             { low: 2.50, median: 3.50, high: 5.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-08-august-2021':           { low: 2.50, median: 3.50, high: 5.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-09-september-bfk-2021':    { low: 2.50, median: 3.50, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-10-october-halloween-2021': { low: 3.00, median: 5.00, high: 10.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-11-always-rad':            { low: 2.50, median: 3.50, high: 5.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-12-holographic-reindeer': { low: 3.50, median: 5.50, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-12-christmas-station-wagon': { low: 2.50, median: 3.75, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2021-12-blue-city-santa-bicycle': { low: 2.50, median: 3.75, high: 5.99, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2022 — Common, good supply from bulk resellers
  // ═══════════════════════════════════════
  'db-2022-01-make-optimism-come-true':   { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-02-radiate-kindness-1992':     { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-02-cow-powered':              { low: 2.13, median: 2.50, high: 4.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-03-march-2022':               { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-04-peace-of-mind':            { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-05-serving-good-vibes':        { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-05-dane-rainbow-2022':         { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-06-pixel-shark-fathers-day':   { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-06-oval-grid-windmill':        { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-07-next-level-chill':          { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-08-august-2022':              { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-09-bfk-2022':                 { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-10-unicorn-skeleton-halloween': { low: 3.00, median: 5.00, high: 10.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-11-radical-life':             { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-12-green-sparkle-windmill':   { low: 2.13, median: 2.50, high: 4.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2022-12-winter-solstice-samhain': { low: 4.00, median: 5.48, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2023 — Common, widely available
  // ═══════════════════════════════════════
  'db-2023-01-roller-skate-party-1992':   { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-02-green-town':              { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-02-share-dutch-luv':          { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-03-glitter-mushroom-windmill':{ low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-04-april-2023':              { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-05-dane-2023':               { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-06-flamingo-skeleton-pool':   { low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-07-greetings-from-postcard':  { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-08-august-2023':             { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-09-love-the-grind-skateboard':{ low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-09-beautifall-orange-windmill':{ low: 2.50, median: 3.50, high: 5.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-09-bfk-green-bus':           { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-10-black-cat-beanie-cup': { low: 3.50, median: 6.00, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-11-rockin-around':           { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-12-winter-hippo-skiing':     { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2023-12-rebel-without-a-clause':  { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2024 — Common, high supply
  // ═══════════════════════════════════════
  'db-2024-01-holographic-disco':         { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-02-february-2024':            { low: 2.00, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-03-athletic-fox-rainbow-pot': { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-04-april-2024':              { low: 1.75, median: 2.25, high: 3.29, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-05-dane-2024':               { low: 2.13, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-06-rad-dad-car':             { low: 1.75, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-07-july-2024':               { low: 1.75, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-08-august-2024':             { low: 1.75, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-09-caramel-apple':           { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-09-bfk-team-dutch':          { low: 1.75, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-10-wishes-do-come-true-wizard':{ low: 1.75, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-11-stay-lit-holiday-turkey':  { low: 1.75, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-11-first-day-fall-pumpkin':   { low: 1.75, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-12-gingerbread-cookie-windmill': { low: 3.00, median: 5.00, high: 8.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-12-glitter-groovy-and-bright':{ low: 2.13, median: 2.50, high: 4.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-special-cold-brew-day-pit-crew': { low: 2.50, median: 3.50, high: 5.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-special-love-your-pet-day': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2025 — Recent, plentiful supply
  // ═══════════════════════════════════════
  'db-2025-01-january-2025':             { low: 1.50, median: 2.00, high: 3.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-02-dutch-luv-2025':           { low: 1.50, median: 2.00, high: 3.29, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-02-dutch-mom-red-tulips':     { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-03-ufo-out-of-this-world':   { low: 1.50, median: 2.00, high: 3.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-03-take-it-easy-skateboard': { low: 1.50, median: 2.00, high: 3.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-04-april-2025-pickle': { low: 3.00, median: 5.00, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-05-luggage':                 { low: 1.50, median: 2.00, high: 2.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-05-change-the-world':        { low: 1.50, median: 2.00, high: 2.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-06-hedgehog-fan-design':     { low: 1.50, median: 2.00, high: 3.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-06-scavenger-hunt-jersey':   { low: 2.00, median: 3.00, high: 4.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-07-july-2025':               { low: 1.50, median: 2.00, high: 2.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-08-livin-for-killer-coffee': { low: 1.50, median: 2.00, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-09-station-wagon-dog-pumpkins': { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-09-sneakers-surprise-drop': { low: 3.00, median: 5.00, high: 10.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-10-cherry-lonely-ghost-collab': { low: 4.00, median: 7.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-11-merry-amped-christmas-lights': { low: 1.75, median: 2.50, high: 3.75, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-11-scented-candy-cane': { low: 3.00, median: 6.00, high: 12.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-12-rock-the-holiday-snowman': { low: 1.75, median: 2.50, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-12-vw-surf-van-christmas':   { low: 1.75, median: 2.50, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // 2026 — Current, freshly dropped
  // ═══════════════════════════════════════
  'db-2026-01-mad-chemist-limitless':    { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2026-01-dj-sun-turntable':        { low: 1.50, median: 2.00, high: 3.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2026-02-good-times-calling-brick-phone': { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2026-02-heart-sunglasses-dutch-luv': { low: 1.50, median: 2.25, high: 3.50, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2026-03-march-2026-set':          { low: 2.00, median: 3.00, high: 4.99, lastUpdated: '2026-03-31T00:00:00Z' },

  // ═══════════════════════════════════════
  // SPECIALS / REGIONAL / GRAND OPENING
  // ═══════════════════════════════════════
  'db-0-special-original-logo':       { low: 1.00, median: 2.00, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-0-special-you-be-you-frog':     { low: 2.13, median: 2.50, high: 3.99, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-0-special-grand-opening-good-vibes': { low: 5.00, median: 8.00, high: 15.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-special-florida-grand-opening': { low: 6.00, median: 12.00, high: 25.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2024-special-texas-grand-opening': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2025-special-grand-opening-shark-attack': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-0-special-sacramento-good-vibes': { low: 5.00, median: 12.00, high: 23.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-0-special-regional-arden': { low: 5.00, median: 10.00, high: 20.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-0-special-regional-las-vegas': { low: 5.00, median: 12.00, high: 22.00, lastUpdated: '2026-03-31T00:00:00Z' },
  'db-2026-special-one-broista-mini-charms': { low: 12.00, median: 25.00, high: 50.00, lastUpdated: '2026-03-31T00:00:00Z' },
};

/** Hydrate zustand `priceCache` with catalog guide prices (user/API pulls overlay on top). */
export function preseededAsEstimatedCache(): Record<
  string,
  { low: number; median: number; high: number; lastUpdated: string; source: 'estimated' }
> {
  const out: Record<
    string,
    { low: number; median: number; high: number; lastUpdated: string; source: 'estimated' }
  > = {};
  for (const [id, row] of Object.entries(PRESEEDED_PRICES)) {
    out[id] = { ...row, source: 'estimated' };
  }
  return out;
}
