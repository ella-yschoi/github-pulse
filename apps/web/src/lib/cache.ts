/**
 * 간단한 메모리 캐시 구현
 * 프로덕션에서는 Redis나 다른 캐시 솔루션 사용 예정
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // TTL 체크
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * 캐시에서 데이터 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 캐시 클리어
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 항목들 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 크기 반환
   */
  size(): number {
    return this.cache.size;
  }
}

// 전역 캐시 인스턴스
export const cache = new MemoryCache();

/**
 * 캐시 키 생성 헬퍼
 */
export function createCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * GitHub API 응답 캐시 키 생성
 */
export function createGitHubCacheKey(
  userId: string,
  endpoint: string,
  params?: Record<string, unknown>
): string {
  const paramString = params ? `:${JSON.stringify(params)}` : '';
  return createCacheKey('github', userId, endpoint, paramString);
}

/**
 * 캐시 TTL 상수 (밀리초)
 */
export const CACHE_TTL = {
  SHORT: 60000, // 1분
  MEDIUM: 300000, // 5분
  LONG: 1800000, // 30분
  VERY_LONG: 3600000, // 1시간
  ULTRA_LONG: 7200000, // 2시간
} as const;
