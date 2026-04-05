export type StickerCategory =
  | 'monthly'
  | 'holiday'
  | 'special_event'
  | 'regional'
  | 'grand_opening'
  | 'collab'
  | 'fundraiser'
  | 'app_exclusive'
  | 'surprise_drop'
  | 'scavenger_hunt'
  | 'legacy';

export type StickerRarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'grail';

export type StickerCondition = 'mint' | 'near_mint' | 'good' | 'fair' | 'poor';

export interface Sticker {
  id: string;
  name: string;
  description: string;
  releaseDate: string; // ISO date
  month: number;
  year: number;
  category: StickerCategory;
  rarity: StickerRarity;
  tags: string[];
  imageUrl?: string;
  ebaySearchQuery: string;
  isScented?: boolean;
  isHolographic?: boolean;
  isGlitter?: boolean;
  region?: string;
  estimatedValue?: PriceData;
}

export interface PriceData {
  low: number;
  median: number;
  high: number;
  lastUpdated: string;
  recentSales: EbaySale[];
  source: 'ebay_api' | 'firecrawl' | 'manual' | 'estimated';
  /** Representative listing image (first result with a thumbnail). */
  thumbnailUrl?: string;
}

export interface EbaySale {
  title: string;
  price: number;
  date: string;
  condition: string;
  url?: string;
  imageUrl?: string;
}

/** One row from eBay search / Firecrawl extract before comp filtering. */
export interface EbaySearchResult {
  title: string;
  price: number;
  currency: string;
  condition: string;
  imageUrl?: string;
  itemUrl: string;
  endDate: string;
}

export interface InventoryItem {
  stickerId: string;
  quantity: number;
  condition: StickerCondition;
  acquisitionDate?: string;
  acquisitionCost?: number;
  notes?: string;
  forTrade: boolean;
  forSale: boolean;
  askingPrice?: number;
}

export interface CollectionStats {
  totalUnique: number;
  totalStickers: number;
  totalCatalog: number;
  completionPercent: number;
  estimatedValue: number;
  totalInvested: number;
  potentialProfit: number;
  rarestOwned: Sticker | null;
  mostValuable: Sticker | null;
  missingCount: number;
}

export interface FilterState {
  search: string;
  years: number[];
  categories: StickerCategory[];
  rarities: StickerRarity[];
  owned: 'all' | 'owned' | 'missing' | 'duplicates' | 'for_trade';
  sortBy: 'date_desc' | 'date_asc' | 'name' | 'value_desc' | 'value_asc' | 'rarity';
}

export interface EbayConfig {
  apiKey?: string;
  useSandbox: boolean;
}

export interface FirecrawlConfig {
  apiKey?: string;
  enabled: boolean;
}

export interface AppConfig {
  ebay: EbayConfig;
  firecrawl: FirecrawlConfig;
  theme: 'dark' | 'light';
  autoRefreshPrices: boolean;
  priceRefreshInterval: number; // hours
}
