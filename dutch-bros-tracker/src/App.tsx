import { useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import { stickerImageUrl } from './utils/stickerImage';
import { STICKER_CATALOG, CATALOG_YEARS, CATEGORY_LABELS, RARITY_LABELS, STICKER_BY_ID } from './data/stickers';
import { filterStickers, formatCurrency, formatDate, getRarityColor, getCategoryIcon } from './utils/helpers';
import { fetchStickerPrice, fetchAllStickerPrices } from './services/ebay';
import type { Sticker, StickerCategory, StickerRarity, StickerCondition } from './types';
import {
  Search, Filter, Grid3X3, List, Clock, Package, TrendingUp, Star, Settings,
  Plus, Minus, X, ExternalLink, RefreshCw, Sparkles,
  Heart, DollarSign, BarChart3, Camera,
} from 'lucide-react';

const ScannerModal = lazy(() => import('./components/ScannerModal'));

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color = '#D4A853' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <div className="bg-db-navy-light border border-db-blue/30 rounded-xl p-4 hover:border-db-gold/40 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-db-cream/50 font-mono">{label}</p>
          <p className="text-2xl font-display mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-db-cream/40 mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/* ── Sticker Card ─────────────────────────────────────── */
function StickerCard({ sticker, onClick }: { sticker: Sticker; onClick: () => void }) {
  const { priceCache, getTotalQuantity } = useAppStore();
  const qty = getTotalQuantity(sticker.id);
  const price = priceCache[sticker.id];
  const owned = qty > 0;
  const rarityColor = getRarityColor(sticker.rarity);
  const imgUrl = stickerImageUrl(sticker, price);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-db-navy-light border rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
        owned ? 'border-db-green/40' : 'border-db-blue/20 opacity-75 hover:opacity-100'
      }`}
    >
      <div className="h-1 w-full" style={{ background: rarityColor }} />
      {imgUrl ? (
        <div className="aspect-[4/3] bg-db-navy overflow-hidden">
          <img
            src={imgUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-db-navy/80 flex flex-col items-center justify-center gap-1 text-db-cream/25 px-4 text-center">
          <Package size={28} strokeWidth={1.25} />
          <span className="text-[10px] font-mono uppercase tracking-wider">Pull price to load photo</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg leading-tight truncate text-db-cream">{sticker.name}</h3>
            <p className="text-xs text-db-cream/50 mt-0.5">{formatDate(sticker.releaseDate)}</p>
          </div>
          {owned && (
            <span className="shrink-0 bg-db-green/20 text-db-green text-xs font-mono px-2 py-0.5 rounded-full">
              ×{qty}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-db-blue/30 text-db-cream/60">
            {getCategoryIcon(sticker.category)} {CATEGORY_LABELS[sticker.category]}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: `${rarityColor}20`, color: rarityColor }}
          >
            {RARITY_LABELS[sticker.rarity].label}
          </span>
          {sticker.isHolographic && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">✨ Holo</span>
          )}
          {sticker.isScented && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">👃 Scented</span>
          )}
          {sticker.isGlitter && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">✨ Glitter</span>
          )}
          {sticker.region && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-db-orange/20 text-db-orange">📍 {sticker.region}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-db-cream/40">
            {price ? (
              <span className="text-db-gold font-mono">{formatCurrency(price.median)}</span>
            ) : (
              <span className="italic">No price data</span>
            )}
          </div>
          <a
            href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(sticker.ebaySearchQuery)}&LH_Sold=1&LH_Complete=1`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-db-cream/30 hover:text-db-orange transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Panel ─────────────────────────────────────── */
function DetailPanel({ sticker, onClose }: { sticker: Sticker; onClose: () => void }) {
  const {
    inventory, priceCache, addToInventory, removeFromInventory,
    updateInventoryItem, getTotalQuantity, updateMarketData, config,
  } = useAppStore();
  const [addQty, setAddQty] = useState(1);
  const [addCondition, setAddCondition] = useState<StickerCondition>('mint');
  const [addCost, setAddCost] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);

  const items = inventory[sticker.id] || [];
  const qty = getTotalQuantity(sticker.id);
  const price = priceCache[sticker.id];
  const heroImage = stickerImageUrl(sticker, price);
  const rarityColor = getRarityColor(sticker.rarity);

  const handleFetchPrice = async () => {
    setFetchingPrice(true);
    try {
      const result = await fetchStickerPrice(
        sticker.ebaySearchQuery,
        config.ebay.apiKey,
        config.firecrawl.apiKey,
      );
      if (result) {
        updateMarketData(sticker.id, result);
      }
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleAdd = () => {
    addToInventory(sticker.id, addQty, addCondition);
    if (addCost) {
      const costNum = parseFloat(addCost);
      if (!isNaN(costNum)) {
        // setTimeout because the state hasn't updated yet from addToInventory
        setTimeout(() => {
          const currentItems = useAppStore.getState().inventory[sticker.id] || [];
          if (currentItems.length > 0) {
            useAppStore.getState().updateInventoryItem(sticker.id, currentItems.length - 1, { acquisitionCost: costNum });
          }
        }, 50);
      }
    }
    setAddCost('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-db-navy-light border border-db-blue/30 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-db-navy-light border-b border-db-blue/20 p-5 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="h-1 w-16 rounded mb-3" style={{ background: rarityColor }} />
              <h2 className="font-display text-2xl text-db-cream">{sticker.name}</h2>
              <p className="text-sm text-db-cream/50 mt-1">{formatDate(sticker.releaseDate)}</p>
            </div>
            <button onClick={onClose} className="text-db-cream/40 hover:text-db-cream"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {heroImage && (
            <div className="rounded-xl overflow-hidden border border-db-blue/20 bg-db-navy aspect-[16/10] max-h-56">
              <img
                src={heroImage}
                alt=""
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <p className="text-sm text-db-cream/70 leading-relaxed">{sticker.description}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-lg bg-db-blue/30 text-db-cream/70">
              {getCategoryIcon(sticker.category)} {CATEGORY_LABELS[sticker.category]}
            </span>
            <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: `${rarityColor}20`, color: rarityColor }}>
              {RARITY_LABELS[sticker.rarity].label}
            </span>
            {sticker.isHolographic && <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300">✨ Holographic</span>}
            {sticker.isScented && <span className="text-xs px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300">👃 Scented</span>}
            {sticker.isGlitter && <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300">✨ Glitter</span>}
            {sticker.region && <span className="text-xs px-2 py-1 rounded-lg bg-db-orange/20 text-db-orange">📍 {sticker.region}</span>}
          </div>

          {/* Market Value */}
          <div className="bg-db-navy/60 rounded-xl p-4 border border-db-blue/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider text-db-cream/50 font-mono">Market comps</h3>
              <button
                onClick={handleFetchPrice}
                disabled={fetchingPrice || (!config.ebay.apiKey && !config.firecrawl.apiKey)}
                className="flex items-center gap-1 text-xs text-db-orange hover:text-db-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={12} className={fetchingPrice ? 'animate-spin' : ''} />
                {fetchingPrice ? 'Fetching...' : 'Refresh Price'}
              </button>
            </div>
            {price ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-db-navy/50 rounded-lg p-2">
                  <p className="text-[10px] text-db-cream/40 uppercase">Low</p>
                  <p className="font-mono text-db-green text-sm">{formatCurrency(price.low)}</p>
                </div>
                <div className="bg-db-navy/50 rounded-lg p-2 ring-1 ring-db-gold/30">
                  <p className="text-[10px] text-db-cream/40 uppercase">Median</p>
                  <p className="font-mono text-db-gold text-lg">{formatCurrency(price.median)}</p>
                </div>
                <div className="bg-db-navy/50 rounded-lg p-2">
                  <p className="text-[10px] text-db-cream/40 uppercase">High</p>
                  <p className="font-mono text-db-red text-sm">{formatCurrency(price.high)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-db-cream/40 italic text-center py-2">
                {config.ebay.apiKey || config.firecrawl.apiKey
                  ? 'Click "Refresh Price" to fetch from eBay'
                  : 'Add eBay or Firecrawl API key in ⚙ Settings to enable pricing'}
              </p>
            )}
            {price?.source && (
              <p className="text-[10px] text-db-cream/30 mt-2 text-center font-mono leading-snug">
                {price.source === 'ebay_api' && 'eBay Browse API — active listings (asking prices).'}
                {price.source === 'firecrawl' && 'Scraped eBay sold results — closer to sold comps.'}
                {price.source !== 'ebay_api' && price.source !== 'firecrawl' && `Source: ${price.source}`}
              </p>
            )}
            {price && price.recentSales && price.recentSales.length > 0 && (
              <div className="mt-4 pt-4 border-t border-db-blue/20">
                <h4 className="text-[10px] uppercase tracking-wider text-db-cream/40 font-mono mb-2">
                  Listing photos (same pull as prices)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {price.recentSales.map((sale, i) => (
                    <a
                      key={i}
                      href={sale.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden border border-db-blue/20 bg-db-navy hover:border-db-orange/40 transition-colors"
                    >
                      {sale.imageUrl ? (
                        <img
                          src={sale.imageUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-db-cream/35">No img</div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-mono text-db-gold px-1 py-0.5 truncate text-center">
                        {formatCurrency(sale.price)}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add to Collection */}
          <div className="bg-db-navy/60 rounded-xl p-4 border border-db-blue/20">
            <h3 className="text-xs uppercase tracking-wider text-db-cream/50 font-mono mb-3">Add to Collection</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-db-navy rounded-lg border border-db-blue/30">
                <button onClick={() => setAddQty(Math.max(1, addQty - 1))} className="p-2 text-db-cream/50 hover:text-db-cream"><Minus size={14} /></button>
                <span className="font-mono text-sm w-6 text-center">{addQty}</span>
                <button onClick={() => setAddQty(addQty + 1)} className="p-2 text-db-cream/50 hover:text-db-cream"><Plus size={14} /></button>
              </div>
              <select
                value={addCondition}
                onChange={(e) => setAddCondition(e.target.value as StickerCondition)}
                className="bg-db-navy border border-db-blue/30 rounded-lg text-xs px-2 py-2 text-db-cream"
              >
                <option value="mint">Mint</option>
                <option value="near_mint">Near Mint</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={addCost}
                onChange={(e) => setAddCost(e.target.value)}
                placeholder="Cost $"
                className="w-20 bg-db-navy border border-db-blue/30 rounded-lg text-xs px-2 py-2 text-db-cream placeholder:text-db-cream/20"
              />
              <button
                onClick={handleAdd}
                className="flex-1 min-w-[80px] bg-db-orange hover:bg-db-orange-dark text-white font-display text-sm tracking-wider py-2 px-4 rounded-lg transition-colors"
              >
                ADD
              </button>
            </div>
          </div>

          {/* Your Inventory */}
          {items.length > 0 && (
            <div className="bg-db-navy/60 rounded-xl p-4 border border-db-green/20">
              <h3 className="text-xs uppercase tracking-wider text-db-green/70 font-mono mb-3">
                ✓ In Your Collection — {qty} total
              </h3>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-db-navy rounded-lg p-3 border border-db-blue/20">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-db-gold text-sm">×{item.quantity}</span>
                      <span className="text-xs text-db-cream/60 capitalize">{item.condition.replace('_', ' ')}</span>
                      {item.acquisitionCost !== undefined && item.acquisitionCost > 0 && (
                        <span className="text-[10px] text-db-cream/40 font-mono">paid {formatCurrency(item.acquisitionCost)}/ea</span>
                      )}
                      <label className="flex items-center gap-1 text-[10px] text-db-cream/40 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.forTrade}
                          onChange={(e) => updateInventoryItem(sticker.id, idx, { forTrade: e.target.checked })}
                          className="w-3 h-3 accent-db-orange"
                        />
                        Trade
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-db-cream/40 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.forSale}
                          onChange={(e) => updateInventoryItem(sticker.id, idx, { forSale: e.target.checked })}
                          className="w-3 h-3 accent-db-green"
                        />
                        Sell
                      </label>
                    </div>
                    <button onClick={() => removeFromInventory(sticker.id, idx)} className="text-db-red/40 hover:text-db-red ml-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {price && (
                <div className="mt-3 pt-3 border-t border-db-blue/20 flex justify-between items-center">
                  <span className="text-xs text-db-cream/40">Est. total value</span>
                  <span className="font-mono text-db-gold">{formatCurrency(qty * price.median)}</span>
                </div>
              )}
            </div>
          )}

          {/* eBay Link */}
          <a
            href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(sticker.ebaySearchQuery)}&LH_Sold=1&LH_Complete=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-db-cream/50 hover:text-db-orange py-2 transition-colors"
          >
            <ExternalLink size={14} /> View sold listings on eBay
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Settings Modal ───────────────────────────────────── */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { config, updateConfig, inventory, priceCache } = useAppStore();
  const [ebayKey, setEbayKey] = useState(config.ebay.apiKey || '');
  const [fcKey, setFcKey] = useState(config.firecrawl.apiKey || '');

  const save = () => {
    updateConfig({
      ebay: { ...config.ebay, apiKey: ebayKey || undefined },
      firecrawl: { ...config.firecrawl, apiKey: fcKey || undefined, enabled: !!fcKey },
    });
    onClose();
  };

  const exportData = () => {
    const data = { inventory, priceCache, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dutch-bros-collection-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-db-navy-light border border-db-blue/30 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl text-db-cream">SETTINGS</h2>
          <button onClick={onClose} className="text-db-cream/40 hover:text-db-cream"><X size={20} /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-db-cream/50 font-mono mb-2">eBay Browse API Token</label>
            <input
              type="password"
              value={ebayKey}
              onChange={(e) => setEbayKey(e.target.value)}
              placeholder="Enter eBay OAuth token..."
              className="w-full bg-db-navy border border-db-blue/30 rounded-lg px-3 py-2 text-sm text-db-cream placeholder:text-db-cream/20 focus:border-db-orange/50 focus:outline-none"
            />
            <p className="text-[10px] text-db-cream/30 mt-1">developer.ebay.com → Create App → OAuth Token (Browse API scope)</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-db-cream/50 font-mono mb-2">Firecrawl API Key</label>
            <input
              type="password"
              value={fcKey}
              onChange={(e) => setFcKey(e.target.value)}
              placeholder="Enter Firecrawl key..."
              className="w-full bg-db-navy border border-db-blue/30 rounded-lg px-3 py-2 text-sm text-db-cream placeholder:text-db-cream/20 focus:border-db-orange/50 focus:outline-none"
            />
            <p className="text-[10px] text-db-cream/30 mt-1">Fallback scraper for eBay sold listings</p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={save}
              className="w-full bg-db-orange hover:bg-db-orange-dark text-white font-display tracking-wider py-2.5 rounded-lg transition-colors"
            >
              SAVE
            </button>
            <button
              onClick={exportData}
              className="w-full bg-db-blue/30 hover:bg-db-blue/50 text-db-cream/70 font-display tracking-wider py-2.5 rounded-lg transition-colors text-sm"
            >
              EXPORT COLLECTION DATA (JSON)
            </button>
          </div>

          <div className="text-[10px] text-db-cream/20 text-center pt-2 space-y-1">
            <p>All data stored locally in your browser. API keys never leave your machine.</p>
            <p className="text-db-cream/15">
              Sticker photos in the vault come from eBay listing thumbnails after a price pull — there is no separate
              open-source image set for every Dutch Bros release.
            </p>
            <p className="text-db-cream/15">
              <strong className="text-db-cream/25">Scanner (camera icon):</strong> uses on-device AI to compare your photo
              to those thumbnails. Fetch catalog photos first, then tap Build index. Works on localhost or HTTPS; iOS may
              require Safari permission for the camera.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────── */
export default function App() {
  const store = useAppStore();
  const {
    filters,
    setFilters,
    resetFilters,
    inventory,
    view,
    setView,
    selectedStickerId,
    setSelectedSticker,
    priceCache,
    config,
    updateMarketData,
  } = store;
  const stats = store.getStats();
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkFetching, setBulkFetching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ completed: 0, total: 0 });
  const bulkAbortRef = useRef<AbortController | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const filteredStickers = useMemo(
    () => filterStickers(STICKER_CATALOG, filters, inventory, priceCache),
    [filters, inventory, priceCache],
  );

  const startBulkPriceFetch = async () => {
    if (!config.ebay.apiKey && !config.firecrawl.apiKey) return;
    bulkAbortRef.current?.abort();
    const ac = new AbortController();
    bulkAbortRef.current = ac;
    setBulkFetching(true);
    setBulkProgress({ completed: 0, total: STICKER_CATALOG.length });
    try {
      await fetchAllStickerPrices(
        STICKER_CATALOG,
        config.ebay.apiKey,
        config.firecrawl.apiKey,
        {
          signal: ac.signal,
          delayMs: 480,
          onProgress: ({ completed, total }) => setBulkProgress({ completed, total }),
          onEach: (id, data) => {
            if (data) updateMarketData(id, data);
          },
        },
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e);
    } finally {
      setBulkFetching(false);
      bulkAbortRef.current = null;
    }
  };

  const stopBulkPriceFetch = () => bulkAbortRef.current?.abort();

  const selectedSticker = selectedStickerId ? STICKER_BY_ID.get(selectedStickerId) : null;

  return (
    <div className="min-h-screen grid-pattern">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-db-navy/90 backdrop-blur-md border-b border-db-blue/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-db-orange flex items-center justify-center shadow-lg shadow-db-orange/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl tracking-wider text-db-cream leading-none">DUTCH BROS STICKER VAULT</h1>
                <p className="text-[10px] text-db-cream/40 font-mono">
                  {STICKER_CATALOG.length} cataloged · {stats.totalUnique} owned · {stats.completionPercent}% complete
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="p-2 text-db-cream/40 hover:text-db-orange transition-colors rounded-lg hover:bg-db-blue/20"
                title="Scan sticker into inventory"
              >
                <Camera size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="p-2 text-db-cream/40 hover:text-db-cream transition-colors"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Unique Owned" value={stats.totalUnique} sub={`of ${stats.totalCatalog}`} icon={Package} color="#66BB6A" />
          <StatCard label="Total Stickers" value={stats.totalStickers} icon={Star} color="#D4A853" />
          <StatCard label="Completion" value={`${stats.completionPercent}%`} icon={BarChart3} color="#42A5F5" />
          <StatCard label="Est. Value" value={formatCurrency(stats.estimatedValue)} icon={DollarSign} color="#66BB6A" />
          <StatCard label="Invested" value={formatCurrency(stats.totalInvested)} icon={TrendingUp} color="#F26522" />
          <StatCard label="Missing" value={stats.missingCount} icon={Heart} color="#EF5350" />
        </div>

        {(config.ebay.apiKey || config.firecrawl.apiKey) && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 bg-db-navy-light border border-db-blue/30 rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startBulkPriceFetch}
                disabled={bulkFetching}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-db-orange/90 hover:bg-db-orange text-white font-display tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={14} className={bulkFetching ? 'animate-spin' : ''} />
                {bulkFetching
                  ? `Fetching… ${bulkProgress.completed} / ${bulkProgress.total}`
                  : `Fetch all prices & photos (${STICKER_CATALOG.length})`}
              </button>
              {bulkFetching && (
                <button
                  type="button"
                  onClick={stopBulkPriceFetch}
                  className="text-xs text-db-cream/50 hover:text-db-orange px-2 py-1"
                >
                  Stop
                </button>
              )}
            </div>
            <p className="text-[10px] text-db-cream/40 leading-relaxed flex-1 min-w-[14rem]">
              Images are not from a separate open-source pack — they are listing thumbnails from the same eBay results as
              each price pull. One request per sticker (~0.5s apart) to stay kind to APIs.
            </p>
          </div>
        )}

        {/* ── Search & Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-cream/30" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search stickers by name, tag, description..."
              className="w-full bg-db-navy-light border border-db-blue/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-db-cream placeholder:text-db-cream/30 focus:border-db-orange/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                showFilters ? 'bg-db-orange/20 border-db-orange/40 text-db-orange' : 'bg-db-navy-light border-db-blue/30 text-db-cream/60 hover:text-db-cream'
              }`}
            >
              <Filter size={14} /> Filters
              {(filters.years.length > 0 || filters.categories.length > 0 || filters.rarities.length > 0 || filters.owned !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-db-orange" />
              )}
            </button>
            <div className="flex bg-db-navy-light border border-db-blue/30 rounded-xl overflow-hidden">
              {([
                { v: 'grid' as const, icon: Grid3X3 },
                { v: 'list' as const, icon: List },
                { v: 'timeline' as const, icon: Clock },
              ]).map(({ v, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-2.5 transition-colors ${view === v ? 'bg-db-blue/40 text-db-cream' : 'text-db-cream/30 hover:text-db-cream/60'}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="bg-db-navy-light border border-db-blue/30 rounded-xl p-4 space-y-4 animate-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-db-cream/50 font-mono">Filters</h3>
              <button onClick={resetFilters} className="text-xs text-db-orange hover:text-db-gold">Reset All</button>
            </div>

            {/* Years */}
            <div>
              <p className="text-[10px] text-db-cream/40 mb-2 uppercase tracking-wider">Year</p>
              <div className="flex flex-wrap gap-1.5">
                {CATALOG_YEARS.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setFilters({ years: filters.years.includes(yr) ? filters.years.filter(y => y !== yr) : [...filters.years, yr] })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      filters.years.includes(yr) ? 'bg-db-orange text-white' : 'bg-db-navy border border-db-blue/30 text-db-cream/50 hover:text-db-cream'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-[10px] text-db-cream/40 mb-2 uppercase tracking-wider">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilters({
                      categories: filters.categories.includes(key as StickerCategory)
                        ? filters.categories.filter(c => c !== key)
                        : [...filters.categories, key as StickerCategory]
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      filters.categories.includes(key as StickerCategory) ? 'bg-db-orange text-white' : 'bg-db-navy border border-db-blue/30 text-db-cream/50 hover:text-db-cream'
                    }`}
                  >
                    {getCategoryIcon(key as StickerCategory)} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity */}
            <div>
              <p className="text-[10px] text-db-cream/40 mb-2 uppercase tracking-wider">Rarity</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(RARITY_LABELS).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => setFilters({
                      rarities: filters.rarities.includes(key as StickerRarity)
                        ? filters.rarities.filter(r => r !== key)
                        : [...filters.rarities, key as StickerRarity]
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border`}
                    style={{
                      borderColor: filters.rarities.includes(key as StickerRarity) ? color : 'rgba(30,58,95,0.3)',
                      background: filters.rarities.includes(key as StickerRarity) ? `${color}30` : 'transparent',
                      color: filters.rarities.includes(key as StickerRarity) ? color : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status + Sort */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[10px] text-db-cream/40 mb-2 uppercase tracking-wider">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'owned', label: 'Owned' },
                    { key: 'missing', label: 'Missing' },
                    { key: 'duplicates', label: 'Dupes' },
                    { key: 'for_trade', label: 'For Trade' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilters({ owned: key })}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        filters.owned === key ? 'bg-db-orange text-white' : 'bg-db-navy border border-db-blue/30 text-db-cream/50 hover:text-db-cream'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-db-cream/40 mb-2 uppercase tracking-wider">Sort</p>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ sortBy: e.target.value as any })}
                  className="bg-db-navy border border-db-blue/30 rounded-lg text-xs px-2 py-1.5 text-db-cream"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name">Name A–Z</option>
                  <option value="rarity">Rarity ↓</option>
                  <option value="value_desc">Value high → low</option>
                  <option value="value_asc">Value low → high</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Count */}
        <p className="text-xs text-db-cream/40 font-mono">
          {filteredStickers.length} of {STICKER_CATALOG.length} stickers
        </p>

        {/* ── Grid View ── */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredStickers.map((s) => (
              <StickerCard key={s.id} sticker={s} onClick={() => setSelectedSticker(s.id)} />
            ))}
          </div>
        )}

        {/* ── List View ── */}
        {view === 'list' && (
          <div className="space-y-1">
            {filteredStickers.map((s) => {
              const qty = store.getTotalQuantity(s.id);
              const price = store.priceCache[s.id];
              const thumb = stickerImageUrl(s, price);
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSticker(s.id)}
                  className={`flex items-center gap-4 bg-db-navy-light border rounded-lg px-4 py-3 cursor-pointer hover:border-db-gold/30 transition-colors ${
                    qty > 0 ? 'border-db-green/20' : 'border-db-blue/10'
                  }`}
                >
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: getRarityColor(s.rarity) }} />
                  <div
                    className={`w-12 h-12 rounded-md shrink-0 border border-db-blue/20 overflow-hidden bg-db-navy ${thumb ? '' : 'opacity-40'}`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-db-cream truncate">{s.name}</p>
                    <p className="text-[10px] text-db-cream/40">{formatDate(s.releaseDate)} · {CATEGORY_LABELS[s.category]}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {qty > 0 && <span className="text-xs font-mono text-db-green">×{qty}</span>}
                    {price && <span className="text-xs font-mono text-db-gold">{formatCurrency(price.median)}</span>}
                    <span className="text-[10px] font-mono hidden sm:inline" style={{ color: getRarityColor(s.rarity) }}>
                      {RARITY_LABELS[s.rarity].label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Timeline View ── */}
        {view === 'timeline' && (
          <div className="space-y-8">
            {CATALOG_YEARS.slice().reverse().map((yr) => {
              const yearStickers = filteredStickers.filter((s) => s.year === yr);
              if (yearStickers.length === 0) return null;
              const ownedThisYear = yearStickers.filter(s => store.getTotalQuantity(s.id) > 0).length;
              return (
                <div key={yr}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-4xl text-db-gold">{yr}</h2>
                    <div className="flex-1 h-px bg-db-gold/20" />
                    <span className="text-xs text-db-cream/40 font-mono">{ownedThisYear}/{yearStickers.length} owned</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {yearStickers.map((s) => (
                      <StickerCard key={s.id} sticker={s} onClick={() => setSelectedSticker(s.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredStickers.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 opacity-30">🔍</div>
            <p className="text-db-cream/40 text-lg font-display">NO STICKERS MATCH</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-db-orange hover:text-db-gold transition-colors">Reset filters</button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-db-blue/20 mt-12">
          <p className="text-[10px] text-db-cream/20 font-mono">
            DUTCH BROS STICKER VAULT · Fan project · Not affiliated with Dutch Bros Coffee
          </p>
          <p className="text-[10px] text-db-cream/15 font-mono mt-1">
            Catalog data compiled from eBay, Etsy, collector communities & official Dutch Bros channels
          </p>
        </footer>
      </main>

      {/* Modals */}
      {selectedSticker && <DetailPanel sticker={selectedSticker} onClose={() => setSelectedSticker(null)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[60] bg-db-navy flex flex-col items-center justify-center gap-3 text-db-cream">
              <RefreshCw className="animate-spin text-db-orange" size={28} />
              <p className="text-sm font-mono text-db-cream/50">Loading scanner…</p>
            </div>
          }
        >
          <ScannerModal
            onClose={() => setShowScanner(false)}
            onViewSticker={(id) => {
              setShowScanner(false);
              setSelectedSticker(id);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
