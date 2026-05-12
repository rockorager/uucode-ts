import stringWidthPackage from "string-width";
import wcwidth from "wcwidth";

import {
  codePointWidth,
  equalFold,
  generalCategory,
  isASCIIHexDigit,
  isDash,
  isDiacritic,
  isDigit,
  isGraphic,
  isHexDigit,
  isLetter,
  isLower,
  isMark,
  isNoncharacter,
  isNumber,
  isPatternSyntax,
  isPatternWhiteSpace,
  isPrint,
  isPunct,
  isQuotationMark,
  isSpace,
  isSymbol,
  isTitle,
  isUnifiedIdeograph,
  isUpper,
  isVariationSelector,
  simpleFold,
  stringWidth,
  toLower,
  toTitle,
  toUpper,
} from "../src/index.js";

const samples = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  "α",
  "∀",
  "😀",
  "👨🏻‍❤️‍👨🏿",
  "क्‍ष",
  "中",
];

const codePoints = samples.flatMap((sample) => [...sample].map((char) => char.codePointAt(0)!));
const binaryPropertyCodePoints = [
  0x30, 0x41, 0x66, 0xff26, 0x67, 0x2d, 0x2014, 0x0300, 0x5e, 0x22, 0x201c, 0x2b, 0x2192, 0x200e,
  0x0a, 0xfe0f, 0xfffe, 0x10ffff, 0x754c, 0x20000, 0x61, 0x20, 0x1f600,
];
const caseMapCodePoints = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  "\u00b5",
  "\u0130",
  "\u01c5",
  "\u01c6",
  "\u03a3",
  "\u03c2",
  "\u212a",
].map((char) => char.codePointAt(0)!);
const equalFoldPairs = [
  ["hello", "HELLO"],
  ["K", "\u212a"],
  ["\u212a", "k"],
  ["\u00b5", "\u039c"],
  ["\u03a3", "\u03c2"],
  ["stra\u00dfe", "STRASSE"],
  ["abc", "abd"],
  ["界", "界"],
] as const;
const equalFoldRegexes = equalFoldPairs.map(
  ([left, right]) => [new RegExp(`^${escapeRegExp(left)}$`, "iu"), right] as const,
);
const iterations = 250_000;
const widthIterations = 250_000;
const upperRegex = /\p{Lu}/u;
const lowerRegex = /\p{Ll}/u;
const titleRegex = /\p{Lt}/u;
const letterRegex = /\p{L}/u;
const numberRegex = /\p{N}/u;
const digitRegex = /\p{Nd}/u;
const markRegex = /\p{M}/u;
const punctRegex = /\p{P}/u;
const symbolRegex = /\p{S}/u;
const graphicRegex = /[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}]/u;
const printRegex = /[\p{L}\p{M}\p{N}\p{P}\p{S} ]/u;
const spaceRegex = /\p{White_Space}/u;
const asciiHexDigitRegex = /\p{ASCII_Hex_Digit}/u;
const hexDigitRegex = /\p{Hex_Digit}/u;
const dashRegex = /\p{Dash}/u;
const diacriticRegex = /\p{Diacritic}/u;
const quotationMarkRegex = /\p{Quotation_Mark}/u;
const patternSyntaxRegex = /\p{Pattern_Syntax}/u;
const patternWhiteSpaceRegex = /\p{Pattern_White_Space}/u;
const variationSelectorRegex = /\p{Variation_Selector}/u;
const noncharacterRegex = /\p{Noncharacter_Code_Point}/u;
const unifiedIdeographRegex = /\p{Unified_Ideograph}/u;
const benchmarkStrings = [
  { name: "ASCII", s: "The quick brown fox jumps over the lazy dog. 0123456789" },
  {
    name: "Combining",
    s: "A\u0300B e\u0301 o\u0300 n\u0303 c\u0327 A\u0300B e\u0301 o\u0300 n\u0303 c\u0327",
  },
  { name: "Emoji", s: "😀😅😻👺👩🏽‍🚀🇨🇭👨🏻‍🍼👨🏻‍❤️‍👨🏿" },
  { name: "Mixed", s: "ASCII A\u0300 👩🏽‍🚀 🇨🇭 क्‍ष 한글 😀 _ end" },
];

function bench(name: string, fn: () => unknown): number {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) fn();
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
  console.log(`${name}: ${elapsed.toFixed(2)}ms`);
  return elapsed;
}

function benchWidth(name: string, fn: () => unknown): void {
  const start = process.hrtime.bigint();
  for (let i = 0; i < widthIterations; i += 1) fn();
  const elapsedNs = Number(process.hrtime.bigint() - start);
  const nsPerOp = elapsedNs / widthIterations;
  console.log(`${name}: ${(elapsedNs / 1e6).toFixed(2)}ms (${nsPerOp.toFixed(1)} ns/op)`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

let i = 0;
bench("uucode-ts general_category", () =>
  generalCategory(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("uucode-ts isUpper", () => isUpper(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp Lu", () =>
  upperRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isLower", () => isLower(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp Ll", () =>
  lowerRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isTitle", () => isTitle(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp Lt", () =>
  titleRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isLetter", () => isLetter(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp L", () =>
  letterRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isNumber", () => isNumber(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp N", () =>
  numberRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isDigit", () => isDigit(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp Nd", () =>
  digitRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isMark", () => isMark(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp M", () =>
  markRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isPunct", () => isPunct(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp P", () =>
  punctRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isSymbol", () => isSymbol(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp S", () =>
  symbolRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isGraphic", () => isGraphic(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp graphic", () =>
  graphicRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isPrint", () => isPrint(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp print", () =>
  printRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isSpace", () => isSpace(codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp White_Space", () =>
  spaceRegex.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts isASCIIHexDigit", () =>
  isASCIIHexDigit(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp ASCII_Hex_Digit", () =>
  asciiHexDigitRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isHexDigit", () =>
  isHexDigit(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Hex_Digit", () =>
  hexDigitRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isDash", () =>
  isDash(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Dash", () =>
  dashRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isDiacritic", () =>
  isDiacritic(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Diacritic", () =>
  diacriticRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isQuotationMark", () =>
  isQuotationMark(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Quotation_Mark", () =>
  quotationMarkRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isPatternSyntax", () =>
  isPatternSyntax(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Pattern_Syntax", () =>
  patternSyntaxRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isPatternWhiteSpace", () =>
  isPatternWhiteSpace(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Pattern_White_Space", () =>
  patternWhiteSpaceRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isVariationSelector", () =>
  isVariationSelector(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Variation_Selector", () =>
  variationSelectorRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isNoncharacter", () =>
  isNoncharacter(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Noncharacter_Code_Point", () =>
  noncharacterRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts isUnifiedIdeograph", () =>
  isUnifiedIdeograph(binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!));

i = 0;
bench("native RegExp Unified_Ideograph", () =>
  unifiedIdeographRegex.test(
    String.fromCodePoint(
      binaryPropertyCodePoints[(i = (i + 1) % binaryPropertyCodePoints.length)]!,
    ),
  ));

i = 0;
bench("uucode-ts toUpper", () =>
  toUpper(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!));

i = 0;
bench("native toUpperCase first code point", () =>
  String.fromCodePoint(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!)
    .toUpperCase()
    .codePointAt(0));

i = 0;
bench("uucode-ts toLower", () =>
  toLower(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!));

i = 0;
bench("native toLowerCase first code point", () =>
  String.fromCodePoint(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!)
    .toLowerCase()
    .codePointAt(0));

i = 0;
bench("uucode-ts toTitle", () =>
  toTitle(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!));

i = 0;
bench("uucode-ts simpleFold", () =>
  simpleFold(caseMapCodePoints[(i = (i + 1) % caseMapCodePoints.length)]!));

i = 0;
bench("uucode-ts equalFold", () => {
  const [left, right] = equalFoldPairs[(i = (i + 1) % equalFoldPairs.length)]!;
  return equalFold(left, right);
});

i = 0;
bench("native RegExp iu equalFold", () => {
  const [regex, right] = equalFoldRegexes[(i = (i + 1) % equalFoldRegexes.length)]!;
  return regex.test(right);
});

for (const { name, s } of benchmarkStrings) {
  benchWidth(`uucode-ts width/${name}`, () => stringWidth(s));
  benchWidth(`string-width width/${name}`, () => stringWidthPackage(s));
  benchWidth(`wcwidth width/${name}`, () => wcwidth(s));
}

i = 0;
bench("uucode-ts codePointWidth", () =>
  codePointWidth(codePoints[(i = (i + 1) % codePoints.length)]!));
