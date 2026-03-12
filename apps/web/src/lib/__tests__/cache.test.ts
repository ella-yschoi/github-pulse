import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Re-import fresh module for each test to get a clean cache instance
let cacheModule: typeof import('../cache');

beforeEach(async () => {
  vi.useFakeTimers();
  // Dynamic import to get fresh module state
  vi.resetModules();
  cacheModule = await import('../cache');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MemoryCache', () => {
  it('returns null for missing keys', () => {
    expect(cacheModule.cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves values', () => {
    cacheModule.cache.set('key', { value: 42 });
    expect(cacheModule.cache.get('key')).toEqual({ value: 42 });
  });

  it('respects TTL — returns null after expiration', () => {
    cacheModule.cache.set('key', 'hello', 1000); // 1 second TTL
    expect(cacheModule.cache.get('key')).toBe('hello');

    vi.advanceTimersByTime(1001);
    expect(cacheModule.cache.get('key')).toBeNull();
  });

  it('delete removes a key', () => {
    cacheModule.cache.set('key', 'value');
    expect(cacheModule.cache.delete('key')).toBe(true);
    expect(cacheModule.cache.get('key')).toBeNull();
  });

  it('clear removes all keys', () => {
    cacheModule.cache.set('a', 1);
    cacheModule.cache.set('b', 2);
    cacheModule.cache.clear();
    expect(cacheModule.cache.size()).toBe(0);
  });

  it('cleanup removes only expired entries', () => {
    cacheModule.cache.set('short', 'x', 500);
    cacheModule.cache.set('long', 'y', 5000);

    vi.advanceTimersByTime(600);
    cacheModule.cache.cleanup();

    expect(cacheModule.cache.get('short')).toBeNull();
    expect(cacheModule.cache.get('long')).toBe('y');
  });

  it('size returns correct count', () => {
    cacheModule.cache.set('a', 1);
    cacheModule.cache.set('b', 2);
    cacheModule.cache.set('c', 3);
    expect(cacheModule.cache.size()).toBe(3);
  });
});

describe('createCacheKey', () => {
  it('joins prefix and parts with colons', () => {
    expect(cacheModule.createCacheKey('prefix', 'a', 'b')).toBe('prefix:a:b');
  });

  it('handles numeric parts', () => {
    expect(cacheModule.createCacheKey('user', 123, 'data')).toBe('user:123:data');
  });
});

describe('createGitHubCacheKey', () => {
  it('creates key without params', () => {
    const key = cacheModule.createGitHubCacheKey('user1', 'overview');
    expect(key).toBe('github:user1:overview:');
  });

  it('creates key with params', () => {
    const key = cacheModule.createGitHubCacheKey('user1', 'repos', { page: 1 });
    expect(key).toContain('github:user1:repos:');
    expect(key).toContain('"page":1');
  });
});
