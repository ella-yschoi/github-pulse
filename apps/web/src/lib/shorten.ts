// URL shortening utility functions

interface ShortenResponse {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
}

interface ShortenError {
  error: string;
}

// Simple hash function
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Base62 encoding
function base62Encode(num: number): string {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }

  return result || '0';
}

// URL parameter compression
export function compressUrlParams(params: Record<string, string>): string {
  // Convert parameters to more compressed format
  const compressed = [
    params.u || '', // username
    params.s || '', // stars
    params.v || '', // views
    params.t || '', // top repo
    params.r || '', // repos count
    params.top3 || '', // top3 data
  ].join('|');

  // Generate hash
  const hash = simpleHash(compressed);
  const shortCode = base62Encode(hash);

  return shortCode;
}

// URL parameter decompression (actually handled on server)
export function decompressUrlParams(
  shortCode: string
): Record<string, string> | null {
  // This function is actually used on the server to convert short codes back to original parameters
  // On the client side, it simply returns the short code
  return null;
}

// Simpler URL compression approach
export function createCompressedUrl(params: Record<string, string>): string {
  // Convert parameters to more compressed format
  const compressed = [
    params.u || '', // username
    params.s || '', // stars
    params.v || '', // views
    params.t || '', // top repo
    params.r || '', // repos count
    params.top3 || '', // top3 data
  ].join(',');

  // Compress with Base64 encoding
  const encoded = btoa(compressed);

  return encoded;
}

// Compressed URL decoding
export function decodeCompressedUrl(
  encoded: string
): Record<string, string> | null {
  try {
    const decoded = atob(encoded);
    const parts = decoded.split(',');

    if (parts.length !== 6) return null; // Expecting 6 parts: u, s, v, t, r, top3

    return {
      u: parts[0],
      s: parts[1],
      v: parts[2],
      t: parts[3],
      r: parts[4],
      top3: parts[5],
    };
  } catch (error) {
    console.error('Error decoding compressed URL:', error);
    return null;
  }
}

// Client-side URL shortening (simpler approach)
export async function shortenUrl(
  url: string
): Promise<ShortenResponse | ShortenError> {
  try {
    // Extract parameters from URL
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Compress parameters
    const compressedCode = createCompressedUrl(params);

    // Generate short URL
    const shortUrl = `${urlObj.origin}/s/${compressedCode}`;

    return {
      shortUrl,
      shortCode: compressedCode,
      originalUrl: url,
    };
  } catch (error) {
    console.error('Error shortening URL:', error);
    return { error: 'Failed to shorten URL' };
  }
}

// Check if URL is a short URL
export function isShortUrl(url: string): boolean {
  return url.includes('/s/') && url.split('/s/')[1]?.length >= 6;
}

// Extract short code
export function extractShortCode(url: string): string | null {
  const match = url.match(/\/s\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
