// Server-side URL mapping store (in production, use DB)
const serverUrlMap = new Map<string, string>();

// URL mapping management function
export function setUrlMapping(shortCode: string, originalUrl: string) {
  serverUrlMap.set(shortCode, originalUrl);
  serverUrlMap.set(originalUrl, shortCode);
}

export function getOriginalUrl(shortCode: string): string | undefined {
  return serverUrlMap.get(shortCode);
}

export function getShortCode(originalUrl: string): string | undefined {
  return serverUrlMap.get(originalUrl);
}

// Simple hash-based short URL generation for client-side use
export function generateShortCode(url: string): string {
  // Simple hash function (for client-side use)
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Base62 encoding
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let num = Math.abs(hash);

  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }

  return result || '0';
}
