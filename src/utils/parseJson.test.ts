import { describe, expect, it } from 'vitest';
import { parseJson } from './parseJson';

describe('parseJson', () => {
  describe('null/undefined input', () => {
    it('returns fallback when value is null', () => {
      expect(parseJson(null, 42)).toBe(42);
      expect(parseJson(null, 'fallback')).toBe('fallback');
      expect(parseJson(null, { a: 1 })).toEqual({ a: 1 });
    });

    it('returns fallback when value is undefined', () => {
      expect(parseJson(undefined, 42)).toBe(42);
      expect(parseJson(undefined, 'fallback')).toBe('fallback');
    });
  });

  describe('valid JSON', () => {
    it('returns parsed object', () => {
      expect(parseJson('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    });

    it('returns parsed number', () => {
      expect(parseJson('42', 0)).toBe(42);
    });

    it('returns parsed string', () => {
      expect(parseJson('"hello"', 'fallback')).toBe('hello');
    });

    it('returns parsed array', () => {
      expect(parseJson('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('returns parsed boolean', () => {
      expect(parseJson('true', false)).toBe(true);
    });

    it('returns fallback when parsed value is null', () => {
      expect(parseJson('null', 42)).toBe(42);
      expect(parseJson('null', 'fallback')).toBe('fallback');
    });
  });

  describe('invalid JSON', () => {
    it('returns original string when parsing fails', () => {
      expect(parseJson('not json', 'fallback')).toBe('not json');
      expect(parseJson('{invalid}', 'fallback')).toBe('{invalid}');
      expect(parseJson('', 'fallback')).toBe('');
    });
  });
});
