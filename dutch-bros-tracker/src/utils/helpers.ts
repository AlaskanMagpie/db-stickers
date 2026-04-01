import type { Sticker, FilterState, StickerCategory, StickerRarity } from '../types';

export function filterStickers(
  stickers: Sticker[],
  filters: FilterState,
  inventory: Record<string, any[]>,
  priceCache?: Record<string, { median: number }>,
): Sticker[] {
  let result = [...stickers];

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Year
  if (filters.years.length > 0) {
    result = result.filter((s) => filters.years.includes(s.year));
  }

  // Category
  if (filters.categories.length > 0) {
    result = result.filter((s) => filters.categories.includes(s.category));
  }

  // Rarity
  if (filters.rarities.length > 0) {
    result = result.filter((s) => filters.rarities.includes(s.rarity));
  }

  // Ownership filter
  switch (filters.owned) {
    case 'owned':
      result = result.filter((s) => inventory[s.id]?.length > 0);
      break;
    case 'missing':
      result = result.filter((s) => !inventory[s.id] || inventory[s.id].length === 0);
      break;
    case 'duplicates':
      result = result.filter((s) => {
        const items = inventory[s.id] || [];
        return items.reduce((sum: number, i: any) => sum + i.quantity, 0) > 1;
      });
      break;
    case 'for_trade':
      result = result.filter((s) =>
        (inventory[s.id] || []).some((i: any) => i.forTrade),
      );
      break;
  }

  // Sort
  switch (filters.sortBy) {
    case 'date_desc':
      result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      break;
    case 'date_asc':
      result.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
      break;
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rarity': {
      const order = { grail: 0, ultra_rare: 1, rare: 2, uncommon: 3, common: 4 };
      result.sort((a, b) => (order[a.rarity] ?? 5) - (order[b.rarity] ?? 5));
      break;
    }
    case 'value_desc':
      result.sort((a, b) => {
        const pa = priceCache?.[a.id]?.median;
        const pb = priceCache?.[b.id]?.median;
        const va = pa ?? -1;
        const vb = pb ?? -1;
        return vb - va;
      });
      break;
    case 'value_asc':
      result.sort((a, b) => {
        const pa = priceCache?.[a.id]?.median;
        const pb = priceCache?.[b.id]?.median;
        const va = pa ?? Number.POSITIVE_INFINITY;
        const vb = pb ?? Number.POSITIVE_INFINITY;
        return va - vb;
      });
      break;
  }

  return result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export function getRarityColor(rarity: StickerRarity): string {
  const colors: Record<StickerRarity, string> = {
    common: '#78909C',
    uncommon: '#66BB6A',
    rare: '#42A5F5',
    ultra_rare: '#AB47BC',
    grail: '#FFD740',
  };
  return colors[rarity];
}

export function getCategoryIcon(category: StickerCategory): string {
  const icons: Record<StickerCategory, string> = {
    monthly: '📅',
    holiday: '🎄',
    special_event: '⭐',
    regional: '📍',
    grand_opening: '🎉',
    collab: '🤝',
    fundraiser: '💛',
    app_exclusive: '📱',
    surprise_drop: '🎲',
    scavenger_hunt: '🔍',
    legacy: '🏛️',
  };
  return icons[category];
}
