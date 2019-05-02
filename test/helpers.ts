import * as assert from 'assert'
import { right, either } from 'fp-ts/lib/Either'
import * as t from '../src/index'
import { PathReporter } from '../src/PathReporter'

const chain = either.chain

export function assertStrictEqual<T>(result: t.Validation<T>, expected: any): void {
  t.fold(
    result,
    () => {
      throw new Error(`${result} is not a right`)
    },
    a => assert.deepStrictEqual(a, expected)
  )
}

export function assertSuccess<T>(result: t.Validation<T>, expected?: T): void {
  t.fold(
    result,
    () => {
      throw new Error(`${result} is not a right`)
    },
    a => {
      if (expected !== undefined) {
        assert.deepStrictEqual(a, expected)
      }
    }
  )
}

export function assertStrictSuccess<T>(result: t.Validation<T>, expected: T): void {
  t.fold(
    result,
    () => {
      throw new Error(`${result} is not a right`)
    },
    a => {
      if (expected !== undefined) {
        assert.strictEqual(a, expected)
      }
    }
  )
}

export function assertFailure(codec: t.Any, value: unknown, errors: Array<string>): void {
  const result = codec.decode(value)
  t.fold(
    result,
    () => assert.deepStrictEqual(PathReporter.report(result), errors),
    () => {
      throw new Error(`${result} is not a left`)
    }
  )
}

export const NumberFromString = new t.Type<number, string, unknown>(
  'NumberFromString',
  t.number.is,
  (u, c) =>
    chain(t.string.validate(u, c), s => {
      const n = +s
      return isNaN(n) ? t.failure(u, c, 'cannot parse to a number') : t.success(n)
    }),
  String
)

export const HyphenatedString = new t.Type<string, string, unknown>(
  'HyphenatedString',
  (v): v is string => t.string.is(v) && v.length === 3 && v[1] === '-',
  (u, c) => {
    return chain(t.string.validate(u, c), s => {
      if (s.length === 2) {
        return right(s[0] + '-' + s[1])
      } else {
        return t.failure(s, c)
      }
    })
  },
  a => a[0] + a[2]
)

export const IntegerFromString = t.refinement(NumberFromString, t.Integer.is, 'IntegerFromString')

export function withDefault<T extends t.Mixed>(
  type: T,
  defaultValue: t.TypeOf<T>
): t.Type<t.TypeOf<T>, t.TypeOf<T>, unknown> {
  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(defaultValue)})`,
    type.is,
    v => type.decode(v != null ? v : defaultValue),
    type.encode
  )
}
