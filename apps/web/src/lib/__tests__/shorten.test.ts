import { describe, it, expect } from 'vitest';
import { createCompressedUrl, decodeCompressedUrl, isShortUrl, extractShortCode } from '../shorten';

describe('createCompressedUrl / decodeCompressedUrl round-trip', () => {
  it('encodes and decodes parameters correctly', () => {
    // Note: top3 must not contain commas — the codec uses comma as separator
    const params = {
      u: 'testuser',
      s: '100',
      v: '200',
      t: 'user/repo',
      r: '5',
      top3: 'repo1|repo2|repo3',
    };

    const encoded = createCompressedUrl(params);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeCompressedUrl(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.u).toBe('testuser');
    expect(decoded!.s).toBe('100');
    expect(decoded!.v).toBe('200');
    expect(decoded!.t).toBe('user/repo');
    expect(decoded!.r).toBe('5');
    expect(decoded!.top3).toBe('repo1|repo2|repo3');
  });

  it('handles empty parameter values', () => {
    const params = { u: '', s: '', v: '', t: '', r: '', top3: '' };
    const encoded = createCompressedUrl(params);
    const decoded = decodeCompressedUrl(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.u).toBe('');
  });
});

describe('decodeCompressedUrl', () => {
  it('returns null for invalid base64', () => {
    expect(decodeCompressedUrl('!!!invalid!!!')).toBeNull();
  });

  it('returns null for wrong number of parts', () => {
    // Encode only 3 parts instead of 6
    const encoded = btoa('a,b,c');
    expect(decodeCompressedUrl(encoded)).toBeNull();
  });
});

describe('isShortUrl', () => {
  it('detects short URLs', () => {
    expect(isShortUrl('https://example.com/s/abc123def')).toBe(true);
  });

  it('rejects non-short URLs', () => {
    expect(isShortUrl('https://example.com/dashboard')).toBe(false);
  });

  it('rejects short URLs with code too short', () => {
    expect(isShortUrl('https://example.com/s/abc')).toBe(false);
  });
});

describe('extractShortCode', () => {
  it('extracts code from short URL', () => {
    expect(extractShortCode('https://example.com/s/abc123')).toBe('abc123');
  });

  it('returns null for non-short URL', () => {
    expect(extractShortCode('https://example.com/dashboard')).toBeNull();
  });
});
