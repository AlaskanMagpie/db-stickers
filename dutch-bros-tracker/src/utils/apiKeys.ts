import type { AppConfig } from '../types';

/** Prefer Vite env (e.g. `.env.local`) so localhost can use Firecrawl without pasting into Settings. */
export function resolveFirecrawlKey(persisted?: string): string | undefined {
  const env = import.meta.env.VITE_FIRECRAWL_API_KEY?.trim();
  if (env) return env;
  const p = persisted?.trim();
  return p || undefined;
}

export function hasPricingSource(config: AppConfig): boolean {
  return !!(config.ebay.apiKey?.trim() || resolveFirecrawlKey(config.firecrawl.apiKey));
}
