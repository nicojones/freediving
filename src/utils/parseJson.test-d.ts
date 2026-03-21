import { describe, expectTypeOf, it } from 'vitest';
import { parseJson } from './parseJson';

describe('parseJson types', () => {
  it('returns T when fallback is number', () => {
    expectTypeOf(parseJson(null, 42)).toEqualTypeOf<number>();
    expectTypeOf(parseJson(undefined, 0)).toEqualTypeOf<number>();
    expectTypeOf(parseJson('1', 0)).toEqualTypeOf<number>();
  });

  it('returns T when fallback is string', () => {
    expectTypeOf(parseJson(null, 'fallback')).toEqualTypeOf<string>();
  });

  it('returns T when fallback is object', () => {
    expectTypeOf(parseJson(null, { a: 1 })).toEqualTypeOf<{ a: number }>();
  });

  it('returns T when fallback is array', () => {
    expectTypeOf(parseJson(null, [] as number[])).toEqualTypeOf<number[]>();
  });

  it('accepts string | null | undefined as first parameter', () => {
    expectTypeOf(parseJson).parameters.toEqualTypeOf<
      [value: string | null | undefined, fallback: unknown]
    >();
  });
});
