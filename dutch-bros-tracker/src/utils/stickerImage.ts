import type { Sticker } from '../types';
import type { CachedMarketData } from '../store/useAppStore';

export function stickerImageUrl(sticker: Sticker, market?: CachedMarketData): string | undefined {
  return (
    sticker.imageUrl ??
    market?.thumbnailUrl ??
    market?.recentSales?.find((s) => s.imageUrl)?.imageUrl
  );
}
