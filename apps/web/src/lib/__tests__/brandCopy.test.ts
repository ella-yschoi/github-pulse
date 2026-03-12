import { describe, it, expect } from 'vitest';
import { makeBrandCopy, makeShortBrandCopy, makeDashboardSummary } from '../brandCopy';

describe('makeBrandCopy', () => {
  it('formats small numbers as-is', () => {
    const result = makeBrandCopy({ starsTotal: 42, views14d: 100, topRepoName: 'user/repo' });
    expect(result).toContain('42');
    expect(result).toContain('100');
    expect(result).toContain('user/repo');
  });

  it('formats thousands with K suffix', () => {
    const result = makeBrandCopy({ starsTotal: 1500, views14d: 2300, topRepoName: 'a/b' });
    expect(result).toContain('1.5K');
    expect(result).toContain('2.3K');
  });

  it('formats millions with M suffix', () => {
    const result = makeBrandCopy({ starsTotal: 1500000, views14d: 0, topRepoName: 'a/b' });
    expect(result).toContain('1.5M');
  });

  it('handles zero values', () => {
    const result = makeBrandCopy({ starsTotal: 0, views14d: 0, topRepoName: 'no/repos' });
    expect(result).toContain('0');
    expect(result).toContain('no/repos');
  });
});

describe('makeShortBrandCopy', () => {
  it('produces compact format with bullet separators', () => {
    const result = makeShortBrandCopy({ starsTotal: 500, views14d: 200, topRepoName: 'a/b' });
    expect(result).toMatch(/⭐500.*👀200.*a\/b/);
  });
});

describe('makeDashboardSummary', () => {
  it('includes repo count, stars, and views', () => {
    const result = makeDashboardSummary({ starsTotal: 100, views14d: 50, reposCount: 5 });
    expect(result).toContain('5');
    expect(result).toContain('100');
    expect(result).toContain('50');
  });
});
