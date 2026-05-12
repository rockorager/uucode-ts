# uucode-ts

TypeScript port of [`jacobsandlund/uucode`](https://github.com/jacobsandlund/uucode).

The package has no runtime dependencies. Unicode tables are generated from the
checked-in Unicode Character Database files during `npm run build`.

```ts
import {
  equalFold,
  generalCategory,
  graphemes,
  isEmojiPresentation,
  stringWidth,
  toUpper,
} from "uucode-ts";

generalCategory(0x2200); // "symbol_math"
isEmojiPresentation(0x1f600); // true
toUpper(0x00b5); // 0x039c
equalFold("K", "\u212a"); // true
stringWidth("ò👨🏻‍❤️‍👨🏿_"); // 4

for (const segment of graphemes("👩🏽‍🚀🇨🇭")) {
  console.log(segment);
  // { segment: "👩🏽‍🚀", start: 0, end: 7 }
  // { segment: "🇨🇭", start: 7, end: 11 }
}
```

Focused entry points are also available:

```ts
import * as ascii from "uucode-ts/ascii";
import { graphemes } from "uucode-ts/grapheme";
import { isUpper } from "uucode-ts/properties";
import { stringWidth } from "uucode-ts/width";
```

## Public API

Most functions that accept a code point take a JavaScript `number` in the range
`0x0000..0x10ffff`. Invalid code points throw `RangeError`.

### Root

The root module exports the commonly used Unicode helpers:

```ts
import {
  codePointWidth,
  eastAsianWidth,
  equalFold,
  generalCategory,
  graphemeBreakProperty,
  graphemes,
  graphemesNoControl,
  isLetter,
  isSpace,
  lineBreak,
  sentenceBreak,
  simpleFold,
  stringWidth,
  toLower,
  toTitle,
  toUpper,
  wordBreak,
} from "uucode-ts";
```

### Properties

`uucode-ts/properties` exposes code point property lookups, case mappings, and
predicate helpers.

```ts
import {
  eastAsianWidth,
  generalCategory,
  graphemeBreakProperty,
  isDigit,
  isEmojiPresentation,
  isLetter,
  isPunct,
  isSpace,
  toLower,
} from "uucode-ts/properties";

generalCategory(0x41); // "letter_uppercase"
eastAsianWidth(0xff01); // "fullwidth"
graphemeBreakProperty(0x200d); // "zwj"
isLetter(0x754c); // true
isSpace(0x00a0); // true
toLower(0x0130); // 0x0069
```

Property lookups:

| Function | Returns |
|---|---|
| `generalCategory(cp)` | Unicode general category |
| `eastAsianWidth(cp)` | East Asian Width |
| `wordBreak(cp)` | Word break property |
| `sentenceBreak(cp)` | Sentence break property |
| `lineBreak(cp)` | Line break property |
| `graphemeBreakProperty(cp)` | Grapheme break property |

Case helpers:

| Function | Behavior |
|---|---|
| `toUpper(cp)` | Simple uppercase mapping |
| `toLower(cp)` | Simple lowercase mapping |
| `toTitle(cp)` | Simple titlecase mapping |
| `simpleFold(cp)` | Next code point in the Unicode simple-fold cycle |
| `equalFold(a, b)` | String equality under Unicode simple case folding |

Predicate helpers:

```ts
isUpper(cp);
isLower(cp);
isTitle(cp);
isLetter(cp);
isNumber(cp);
isDigit(cp);
isMark(cp);
isPunct(cp);
isSymbol(cp);
isGraphic(cp);
isPrint(cp);
isControl(cp);
isSpace(cp);
isASCIIHexDigit(cp);
isHexDigit(cp);
isDash(cp);
isDiacritic(cp);
isQuotationMark(cp);
isPatternSyntax(cp);
isPatternWhiteSpace(cp);
isVariationSelector(cp);
isNoncharacter(cp);
isUnifiedIdeograph(cp);
isEmojiPresentation(cp);
isExtendedPictographic(cp);
```

### Graphemes

`uucode-ts/grapheme` exposes iterators over extended grapheme clusters.

```ts
import { GraphemeIterator, graphemes } from "uucode-ts/grapheme";

for (const item of graphemes("A\u0300🇨🇭")) {
  item.segment;
  item.start;
  item.end;
}

const it = new GraphemeIterator("👩🏽‍🚀🇨🇭");
it.peekSegment(); // does not advance
it.nextSegment(); // advances
it.clone(); // copies iterator state
```

`graphemesNoControl(input)` and `GraphemeIteratorNoControl` use the same API but
ignore control-code grapheme breaks.

### Width

`uucode-ts/width` exposes terminal cell-width helpers:

```ts
import { codePointWidth, stringWidth } from "uucode-ts/width";

codePointWidth(0x3000); // 2
stringWidth("A\u0300👩🏽‍🚀"); // 3
```

`codePointWidth(cp)` returns the standalone width of a single code point.
`stringWidth(input)` computes grapheme-aware string width.

### ASCII

`uucode-ts/ascii` exposes small ASCII-only helpers:

```ts
import { isAlphanumeric, isHex, toLower, toUpper } from "uucode-ts/ascii";

isAlphanumeric(0x41); // true
isHex(0x66); // true
toUpper(0x61); // 0x41
toLower(0x41); // 0x61
```

Available ASCII helpers are `isAscii`, `isAlphanumeric`, `isAlphabetic`,
`isControl`, `isDigit`, `isHex`, `isLower`, `isPrint`, `isUpper`,
`isWhitespace`, `toLower`, and `toUpper`.

## Benchmarks

Benchmarks below were run on an Apple M4 Max with Node.js 22.19.0. Each row is
based on `npm run benchmark`; lower `ns/op` is better. The ratio column is
`baseline / uucode-ts`, so values above `1.00x` mean `uucode-ts` is faster.

General category lookup has no direct native equivalent:

| Benchmark | uucode-ts ns/op |
|---|---:|
| `generalCategory` | 19.20 |
| `codePointWidth` | 8.80 |

Predicate APIs are benchmarked against precompiled Unicode property regular
expressions on a rotating mixed code point corpus:

| Predicate benchmark | uucode-ts ns/op | RegExp ns/op | Ratio |
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

| Binary property benchmark | uucode-ts ns/op | RegExp ns/op | Ratio |
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

| Case mapping benchmark | uucode-ts ns/op | Native ns/op | Ratio |
|---|---:|---:|---:|
| `toUpper` | 8.56 | 18.20 | 2.13x |
| `toLower` | 8.24 | 13.76 | 1.67x |
| `toTitle` | 8.36 | n/a | n/a |
| `simpleFold` | 7.80 | n/a | n/a |

String case folding is benchmarked against precompiled Unicode ignore-case
regular expressions:

| EqualFold benchmark | uucode-ts ns/op | RegExp ns/op | Ratio |
|---|---:|---:|---:|
| `equalFold` | 17.80 | 15.68 | 0.88x |

Terminal width is benchmarked against `string-width` and `wcwidth`:

| Width benchmark | uucode-ts ns/op | string-width ns/op | wcwidth ns/op |
|---|---:|---:|---:|
| ASCII | 44.5 | 39.3 | 77.7 |
| Combining | 42.0 | 9419.9 | 269.4 |
| Emoji | 265.5 | 14819.8 | 930.4 |
| Mixed | 337.1 | 13429.5 | 515.5 |

Run the package benchmarks:

```sh
npm run benchmark
```

## Development

```sh
npm install
npm test
npm run benchmark
```
