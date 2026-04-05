import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  InventoryItem,
  FilterState,
  AppConfig,
  CollectionStats,
  StickerCondition,
  PriceData,
  EbaySale,
} from '../types';
import { STICKER_CATALOG, STICKER_BY_ID } from '../data/stickers';
import { preseededAsEstimatedCache } from '../data/prices';

const MAX_PERSISTED_SALES = 6;

export interface UpdateMarketDataOptions {
  /** Keep hero/grid thumbnail and per-row listing images; only refresh $ fields + metadata from the new pull. */
  preserveVisuals?: boolean;
}

export interface CachedMarketData {
  low: number;
  median: number;
  high: number;
  lastUpdated: string;
  source?: PriceData['source'];
  thumbnailUrl?: string;
  recentSales?: EbaySale[];
}

interface AppState {
  // Inventory
  inventory: Record<string, InventoryItem[]>;
  addToInventory: (stickerId: string, qty: number, condition: StickerCondition) => void;
  removeFromInventory: (stickerId: string, index: number) => void;
  updateInventoryItem: (stickerId: string, index: number, updates: Partial<InventoryItem>) => void;

  // Filters
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Price cache (thumbnails + comps come from eBay / Firecrawl pulls)
  priceCache: Record<string, CachedMarketData>;
  updateMarketData: (
    stickerId: string,
    data: PriceData | null,
    options?: UpdateMarketDataOptions,
  ) => void;

  // Config
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;

  // UI
  selectedStickerId: string | null;
  setSelectedSticker: (id: string | null) => void;
  view: 'grid' | 'list' | 'timeline';
  setView: (v: 'grid' | 'list' | 'timeline') => void;

  // Computed
  getStats: () => CollectionStats;
  getInventoryForSticker: (stickerId: string) => InventoryItem[];
  getTotalQuantity: (stickerId: string) => number;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  years: [],
  categories: [],
  rarities: [],
  owned: 'all',
  sortBy: 'date_desc',
};

const DEFAULT_CONFIG: AppConfig = {
  ebay: { useSandbox: false },
  firecrawl: { enabled: false },
  theme: 'dark',
  autoRefreshPrices: false,
  priceRefreshInterval: 24,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      inventory: {},
      filters: DEFAULT_FILTERS,
      priceCache: preseededAsEstimatedCache(),
      config: DEFAULT_CONFIG,
      selectedStickerId: null,
      view: 'grid',

      addToInventory: (stickerId, qty, condition) =>
        set((state) => {
          const existing = state.inventory[stickerId] || [];
          const newItem: InventoryItem = {
            stickerId,
            quantity: qty,
            condition,
            acquisitionDate: new Date().toISOString(),
            forTrade: false,
            forSale: false,
          };
          return {
            inventory: { ...state.inventory, [stickerId]: [...existing, newItem] },
          };
        }),

      removeFromInventory: (stickerId, index) =>
        set((state) => {
          const items = [...(state.inventory[stickerId] || [])];
          items.splice(index, 1);
          const newInv = { ...state.inventory };
          if (items.length === 0) delete newInv[stickerId];
          else newInv[stickerId] = items;
          return { inventory: newInv };
        }),

      updateInventoryItem: (stickerId, index, updates) =>
        set((state) => {
          const items = [...(state.inventory[stickerId] || [])];
          if (items[index]) items[index] = { ...items[index], ...updates };
          return { inventory: { ...state.inventory, [stickerId]: items } };
        }),

      setFilters: (updates) =>
        set((state) => ({ filters: { ...state.filters, ...updates } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      updateMarketData: (stickerId, data, options) =>
        set((state) => {
          if (!data) {
            const next = { ...state.priceCache };
            delete next[stickerId];
            return { priceCache: next };
          }
          const prev = state.priceCache[stickerId];
          const incoming = data.recentSales?.slice(0, MAX_PERSISTED_SALES) ?? [];
          let recentSales: EbaySale[] | undefined =
            incoming.length > 0 ? incoming : undefined;
          let thumbnailUrl =
            data.thumbnailUrl ?? incoming.find((s) => s.imageUrl)?.imageUrl;

          if (options?.preserveVisuals && prev) {
            thumbnailUrl = prev.thumbnailUrl ?? thumbnailUrl;
            if (incoming.length > 0) {
              recentSales = incoming.map((s, i) => ({
                ...s,
                imageUrl: prev.recentSales?.[i]?.imageUrl ?? s.imageUrl,
              }));
            } else if (prev.recentSales?.length) {
              recentSales = prev.recentSales;
            }
          }

          const entry: CachedMarketData = {
            low: data.low,
            median: data.median,
            high: data.high,
            lastUpdated: data.lastUpdated,
            source: data.source,
            thumbnailUrl,
            recentSales,
          };
          return {
            priceCache: { ...state.priceCache, [stickerId]: entry },
          };
        }),

      updateConfig: (updates) =>
        set((state) => ({ config: { ...state.config, ...updates } })),

      setSelectedSticker: (id) => set({ selectedStickerId: id }),
      setView: (v) => set({ view: v }),

      getInventoryForSticker: (stickerId) => get().inventory[stickerId] || [],

      getTotalQuantity: (stickerId) =>
        (get().inventory[stickerId] || []).reduce((sum, i) => sum + i.quantity, 0),

      getStats: () => {
        const { inventory, priceCache } = get();
        const ownedIds = Object.keys(inventory);
        const totalStickers = Object.values(inventory)
          .flat()
          .reduce((sum, i) => sum + i.quantity, 0);
        const totalInvested = Object.values(inventory)
          .flat()
          .reduce((sum, i) => sum + (i.acquisitionCost || 0) * i.quantity, 0);

        let estimatedValue = 0;
        let mostValuableId = '';
        let mostValuablePrice = 0;
        let rarestId = '';
        let rarestScore = 0;
        const rarityScores = { common: 1, uncommon: 2, rare: 3, ultra_rare: 4, grail: 5 };

        for (const id of ownedIds) {
          const price = priceCache[id]?.median || 2.5; // default $2.50
          const qty = (inventory[id] || []).reduce((s, i) => s + i.quantity, 0);
          estimatedValue += price * qty;

          if (price > mostValuablePrice) {
            mostValuablePrice = price;
            mostValuableId = id;
          }

          const sticker = STICKER_BY_ID.get(id);
          if (sticker) {
            const score = rarityScores[sticker.rarity] || 0;
            if (score > rarestScore) {
              rarestScore = score;
              rarestId = id;
            }
          }
        }

        return {
          totalUnique: ownedIds.length,
          totalStickers,
          totalCatalog: STICKER_CATALOG.length,
          completionPercent: Math.round((ownedIds.length / STICKER_CATALOG.length) * 100),
          estimatedValue: Math.round(estimatedValue * 100) / 100,
          totalInvested: Math.round(totalInvested * 100) / 100,
          potentialProfit: Math.round((estimatedValue - totalInvested) * 100) / 100,
          rarestOwned: rarestId ? STICKER_BY_ID.get(rarestId) || null : null,
          mostValuable: mostValuableId ? STICKER_BY_ID.get(mostValuableId) || null : null,
          missingCount: STICKER_CATALOG.length - ownedIds.length,
        };
      },
    }),
    {
      name: 'dutch-bros-tracker',
      partialize: (state) => ({
        inventory: state.inventory,
        priceCache: state.priceCache,
        config: state.config,
        view: state.view,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.priceCache = { ...preseededAsEstimatedCache(), ...state.priceCache };
        }
      },
    }
  )
);
