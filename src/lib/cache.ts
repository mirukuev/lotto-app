const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 86400000; // 24시간

export function getCache(key: string) {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCache(key: string, data: any) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}