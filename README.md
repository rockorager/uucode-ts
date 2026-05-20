# @rockorager/uucode

`@rockorager/uucode` is a small TypeScript Unicode segmentation, width, and
property package inspired by Jacob Sandlund's excellent
[`uucode`](https://github.com/jacobsandlund/uucode). Jacob's Zig implementation
does the hard architectural work here: generated Unicode tables, compact
property rows, and fast lookup strategies. This package ports that table-first
approach to TypeScript.

It provides:

- extended grapheme cluster iteration over JavaScript strings
- UAX #14 line break opportunity iteration over JavaScript strings
- grapheme-aware terminal cell width with `stringWidth`
- narrow lookup APIs for generated Unicode category, break, binary, emoji, width, and case properties
- no runtime UCD parser, cache, or fallback path

## Usage

```ts
import {
  equalFold,
  generalCategory,
  graphemes,
  isLetter,
  lineBreak,
  lineSegments,
  stringWidth,
  toUpper,
  wordBreak,
} from "@rockorager/uucode";

const s = "👩🏽‍🚀🇨🇭A\u0300";

for (const g of graphemes(s)) {
  console.log(JSON.stringify(g.segment), `[${g.start}:${g.end}]`);
}

for (const seg of lineSegments("hello world")) {
  console.log(JSON.stringify("hello world".slice(seg.start, seg.end)), seg.break);
}

console.log(stringWidth("ò👨🏻‍❤️‍👨🏿_"));
console.log(isLetter(0x754c), wordBreak(0x41), lineBreak(0x20));
console.log(toUpper(0x00b5), equalFold("K", "\u212a"));
console.log(generalCategory(0x2200));
```

Focused entry points are also available:

```ts
import * as ascii from "@rockorager/uucode/ascii";
import { graphemes } from "@rockorager/uucode/grapheme";
import { lineSegments } from "@rockorager/uucode/linebreak";
import { isUpper } from "@rockorager/uucode/properties";
import { stringWidth } from "@rockorager/uucode/width";
```

Most functions that accept a code point take a JavaScript `number` in the range
`0x0000..0x10ffff`. Invalid code points throw `RangeError`, except
`codePointWidth`, which returns `0` to match standalone rune width policy.
Grapheme iterators return `{ segment, start, end }`, where offsets are
JavaScript string indexes.

## Benchmarks

Benchmarks below were run on an Apple M4 Max with Node.js 22.19.0. Each row is
based on `npm run benchmark`; lower `ns/op` is better. The ratio column is
`baseline / @rockorager/uucode`, so values above `1.00x` mean
`@rockorager/uucode` is faster.

Terminal width is benchmarked against `string-width` and `wcwidth`:

| Width benchmark | @rockorager/uucode ns/op | string-width ns/op | wcwidth ns/op |
|---|---:|---:|---:|
| ASCII | 44.5 | 39.3 | 77.7 |
| Combining | 42.0 | 9419.9 | 269.4 |
| Emoji | 265.5 | 14819.8 | 930.4 |
| Mixed | 337.1 | 13429.5 | 515.5 |

Grapheme iteration is benchmarked against `Intl.Segmenter`:

| Grapheme benchmark | @rockorager/uucode ns/op | Intl.Segmenter ns/op | Ratio |
|---|---:|---:|---:|
| ASCII | 1199.4 | 10369.0 | 8.65x |
| Combining | 649.2 | 4713.3 | 7.26x |
| Emoji | 574.6 | 2505.0 | 4.36x |
| Mixed | 761.6 | 5286.7 | 6.94x |

General category lookup has no direct native equivalent:

| Benchmark | @rockorager/uucode ns/op |
|---|---:|
| `generalCategory` | 19.20 |
| `codePointWidth` | 8.80 |

Predicate APIs are benchmarked against precompiled Unicode property regular
expressions on a rotating mixed code point corpus:

| Predicate benchmark | @rockorager/uucode ns/op | RegExp ns/op | Ratio |
|---|---:|---:|---:|
| `isUpper` | 12.24 | 18.48 | 1.51x |
| `isLower` | 11.00 | 18.36 | 1.67x |
| `isTitle` | 10.80 | 20.92 | 1.94x |
| `isLetter` | 11.76 | 19.40 | 1.65x |
| `isNumber` | 10.88 | 16.60 | 1.53x |
| `isDigit` | 11.20 | 16.36 | 1.46x |
| `isMark` | 10.64 | 15.68 | 1.47x |
| `isPunct` | 13.92 | 16.48 | 1.18x |
| `isSymbol` | 12.24 | 22.80 | 1.86x |
| `isGraphic` | 14.48 | 19.76 | 1.36x |
| `isPrint` | 13.88 | 19.88 | 1.43x |
| `isSpace` | 14.48 | 12.96 | 0.90x |

Generated binary property APIs are benchmarked against matching Unicode property
regular expressions on a property-focused code point corpus:

| Binary property benchmark | @rockorager/uucode ns/op | RegExp ns/op | Ratio |
|---|---:|---:|---:|
| `isASCIIHexDigit` | 6.76 | 14.20 | 2.10x |
| `isHexDigit` | 16.56 | 14.48 | 0.87x |
| `isDash` | 17.88 | 16.56 | 0.93x |
| `isDiacritic` | 20.80 | 23.00 | 1.11x |
| `isQuotationMark` | 17.44 | 15.52 | 0.89x |
| `isPatternSyntax` | 18.04 | 18.20 | 1.01x |
| `isPatternWhiteSpace` | 16.40 | 14.68 | 0.90x |
| `isVariationSelector` | 24.16 | 14.72 | 0.61x |
| `isNoncharacter` | 6.32 | 18.20 | 2.88x |
| `isUnifiedIdeograph` | 23.28 | 16.24 | 0.70x |

Simple case mapping APIs are benchmarked against JavaScript string casing where
there is a close native comparison:

| Case mapping benchmark | @rockorager/uucode ns/op | Native ns/op | Ratio |
|---|---:|---:|---:|
| `toUpper` | 8.56 | 18.20 | 2.13x |
| `toLower` | 8.24 | 13.76 | 1.67x |
| `toTitle` | 8.36 | n/a | n/a |
| `simpleFold` | 7.80 | n/a | n/a |

String case folding is benchmarked against precompiled Unicode ignore-case
regular expressions:

| EqualFold benchmark | @rockorager/uucode ns/op | RegExp ns/op | Ratio |
|---|---:|---:|---:|
| `equalFold` | 17.80 | 15.68 | 0.88x |

Run the package benchmarks:

```sh
npm run benchmark
```

## Generated Tables

The package ships Unicode 17 source files and generates JSON-backed runtime
tables. Width hot paths use three stages:

- `stage1` indexes 256-code-point blocks by `cp >> 8`
- `stage2` indexes the low byte within deduplicated blocks
- `stage3` stores deduplicated packed grapheme and width rows

Regenerate after changing UCD files or generator logic:

```sh
npm run generate
```

The generated tables store property ranges, sparse mapping tables, packed width
rows, grapheme segmentation data, word/sentence/line break properties, East
Asian Width, PropList binary properties, simple case mapping, simple case
folding, and emoji properties used by the public lookup functions.

## Development

```sh
npm install
npm test
npm run benchmark
```

## Attribution

The design is based on the real
[`jacobsandlund/uucode`](https://github.com/jacobsandlund/uucode). If you are
interested in the original implementation, Unicode table generation strategy,
or a Zig library for this problem space, start there.
