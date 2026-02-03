import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = process.env.DATA_CACHE_DIR || './cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();

  async init() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private getCacheFilePath(key: string): string {
    // Sanitize key for filesystem
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(CACHE_DIR, `${sanitizedKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry && Date.now() < memEntry.expiry) {
      return memEntry.data;
    }

    // Check file cache
    try {
      const filePath = this.getCacheFilePath(key);
      const content = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      if (Date.now() < entry.expiry) {
        // Restore to memory cache
        this.memoryCache.set(key, entry);
        return entry.data;
      }

      // Expired, delete file
      await fs.unlink(filePath).catch(() => {});
    } catch {
      // File doesn't exist or is invalid
    }

    return null;
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs,
    };

    // Save to memory cache
    this.memoryCache.set(key, entry);

    // Save to file cache for persistence
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error('Failed to write cache file:', error);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
    } catch {
      // File might not exist
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();

    try {
      const files = await fs.readdir(CACHE_DIR);
      await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => fs.unlink(path.join(CACHE_DIR, f)).catch(() => {}))
      );
    } catch {
      // Directory might not exist
    }
  }

  // Get all cached performance data (for historical accumulation)
  async getHistoricalData(prefix: string): Promise<Map<string, unknown>> {
    const result = new Map<string, unknown>();

    try {
      const files = await fs.readdir(CACHE_DIR);
      for (const file of files) {
        if (file.startsWith(prefix) && file.endsWith('.json')) {
          const content = await fs.readFile(path.join(CACHE_DIR, file), 'utf-8');
          const entry: CacheEntry<unknown> = JSON.parse(content);
          const key = file.replace('.json', '');
          result.set(key, entry.data);
        }
      }
    } catch {
      // Directory might not exist
    }

    return result;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
cacheManager.init();

// Cache TTL constants
export const CACHE_TTL = {
  ACCOUNT_SUMMARY: 5 * 60 * 1000,      // 5 minutes
  POSITIONS: 5 * 60 * 1000,             // 5 minutes
  LEDGER: 5 * 60 * 1000,                // 5 minutes
  ALLOCATION: 10 * 60 * 1000,           // 10 minutes
  PERFORMANCE: 60 * 60 * 1000,          // 1 hour
  TRANSACTIONS: 30 * 60 * 1000,         // 30 minutes
  HISTORICAL_DATA: 24 * 60 * 60 * 1000, // 24 hours (for position history)
  MARKET_DATA: 30 * 1000,               // 30 seconds
  SPY_DATA: 60 * 60 * 1000,             // 1 hour (benchmark)
};
