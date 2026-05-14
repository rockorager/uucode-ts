import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as ascii from "../src/ascii.js";
import * as grapheme from "../src/grapheme_internal.js";
import * as width from "../src/width.js";
import {
  equalFold,
  eastAsianWidth,
  generalCategory,
  graphemeBreakProperty,
  graphemes,
  isASCIIHexDigit,
  isDash,
  isDiacritic,
  isEmojiPresentation,
  isExtendedPictographic,
  isGraphic,
  isHexDigit,
  isNoncharacter,
  isPatternSyntax,
  isPatternWhiteSpace,
  isPrint,
  isPunct,
  isQuotationMark,
  isSpace,
  isSymbol,
  isTitle,
  isUnifiedIdeograph,
  stringWidth,
  lineSegments,
  simpleFold,
  toLower,
  toTitle,
  toUpper,
  isVariationSelector,
} from "../src/index.js";
import type { GeneralCategory } from "../src/index.js";

function toNoControlBreak(
  value: ReturnType<typeof graphemeBreakProperty>,
): ReturnType<typeof graphemeBreakProperty> {
  return value === "control" || value === "cr" || value === "lf" ? "other" : value;
}

test("ascii helpers", () => {
  assert.equal(ascii.isAlphanumeric("A".codePointAt(0)!), true);
  assert.equal(ascii.isAlphabetic("9".codePointAt(0)!), false);
  assert.equal(ascii.isControl(0x7f), true);
  assert.equal(ascii.isDigit(0x35), true);
  assert.equal(ascii.isHex(0x66), true);
  assert.equal(ascii.isPrint(0x20), true);
  assert.equal(ascii.isWhitespace(0x0a), true);
  assert.equal(ascii.toUpper(0x61), 0x41);
  assert.equal(ascii.toLower(0x41), 0x61);
});

test("core Unicode properties", () => {
  assert.equal(generalCategory(65), "letter_uppercase");
  assert.equal(generalCategory(0x2200), "symbol_math");
  assert.equal(eastAsianWidth(0xff01), "fullwidth");
  assert.equal(graphemeBreakProperty(0x000d), "cr");
  assert.equal(graphemeBreakProperty(0x094d), "indic_conjunct_break_linker");
});

test("categorical Unicode properties expose literal union types", () => {
  const category: GeneralCategory = generalCategory(0x2200);
  assert.equal(category, "symbol_math");
});

test("Go-style Unicode predicate helpers", () => {
  assert.equal(toUpper(0x0061), 0x0041);
  assert.equal(toUpper(0x00b5), 0x039c);
  assert.equal(toUpper(0x0041), 0x0041);
  assert.equal(toLower(0x0041), 0x0061);
  assert.equal(toLower(0x0130), 0x0069);
  assert.equal(toLower(0x0061), 0x0061);
  assert.equal(toTitle(0x01c6), 0x01c5);
  assert.equal(toTitle(0x0061), 0x0041);
  assert.equal(toTitle(0x0041), 0x0041);
  assert.equal(simpleFold(0x004b), 0x006b);
  assert.equal(simpleFold(0x006b), 0x212a);
  assert.equal(simpleFold(0x212a), 0x004b);
  assert.equal(simpleFold(0x0031), 0x0031);
  assert.equal(isTitle(0x01c5), true);
  assert.equal(isTitle(0x0041), false);
  assert.equal(isPunct(0x002e), true);
  assert.equal(isPunct(0x2014), true);
  assert.equal(isPunct(0x0041), false);
  assert.equal(isSymbol(0x20ac), true);
  assert.equal(isSymbol(0x1f600), true);
  assert.equal(isSymbol(0x0041), false);
  assert.equal(isGraphic(0x0041), true);
  assert.equal(isGraphic(0x3000), true);
  assert.equal(isGraphic(0x000a), false);
  assert.equal(isPrint(0x0041), true);
  assert.equal(isPrint(0x0020), true);
  assert.equal(isPrint(0x3000), false);
  assert.equal(isPrint(0x000a), false);
  assert.equal(isSpace(0x0020), true);
  assert.equal(isSpace(0x0009), true);
  assert.equal(isSpace(0x00a0), true);
  assert.equal(isSpace(0x3000), true);
  assert.equal(isSpace(0x0041), false);
  assert.equal(isASCIIHexDigit(0x0066), true);
  assert.equal(isASCIIHexDigit(0x0046), true);
  assert.equal(isASCIIHexDigit(0x0039), true);
  assert.equal(isASCIIHexDigit(0xff26), false);
  assert.equal(isHexDigit(0x0066), true);
  assert.equal(isHexDigit(0xff26), true);
  assert.equal(isHexDigit(0x0067), false);
  assert.equal(isDash(0x002d), true);
  assert.equal(isDash(0x2014), true);
  assert.equal(isDash(0x0041), false);
  assert.equal(isDiacritic(0x0300), true);
  assert.equal(isDiacritic(0x005e), true);
  assert.equal(isDiacritic(0x0041), false);
  assert.equal(isQuotationMark(0x0022), true);
  assert.equal(isQuotationMark(0x201c), true);
  assert.equal(isQuotationMark(0x0041), false);
  assert.equal(isPatternSyntax(0x002b), true);
  assert.equal(isPatternSyntax(0x2192), true);
  assert.equal(isPatternSyntax(0x0041), false);
  assert.equal(isPatternWhiteSpace(0x200e), true);
  assert.equal(isPatternWhiteSpace(0x000a), true);
  assert.equal(isPatternWhiteSpace(0x0041), false);
  assert.equal(isVariationSelector(0xfe0f), true);
  assert.equal(isVariationSelector(0x0041), false);
  assert.equal(isNoncharacter(0xfffe), true);
  assert.equal(isNoncharacter(0x10ffff), true);
  assert.equal(isNoncharacter(0x0041), false);
  assert.equal(isUnifiedIdeograph(0x754c), true);
  assert.equal(isUnifiedIdeograph(0x20000), true);
  assert.equal(isUnifiedIdeograph(0x0041), false);
});

test("simple string case folding", () => {
  assert.equal(equalFold("hello", "HELLO"), true);
  assert.equal(equalFold("K", "\u212a"), true);
  assert.equal(equalFold("\u212a", "k"), true);
  assert.equal(equalFold("\u00b5", "\u039c"), true);
  assert.equal(equalFold("\u03a3", "\u03c2"), true);
  assert.equal(equalFold("stra\u00dfe", "STRASSE"), false);
  assert.equal(equalFold("abc", "ab"), false);
  assert.equal(equalFold("abc", "abd"), false);
  assert.equal(equalFold("界", "界"), true);
  assert.equal(equalFold("界", "畍"), false);
});

test("public code point helpers reject invalid code points", () => {
  assert.throws(() => generalCategory(-1), RangeError);
  assert.throws(() => isSpace(0x110000), RangeError);
  assert.throws(() => toUpper(1.5), RangeError);
});

test("code point width follows standalone rune policy", () => {
  assert.equal(width.codePointWidth(-1), 0);
  assert.equal(width.codePointWidth(Number.NaN), 0);
  assert.equal(width.codePointWidth(0x110000), 0);
  assert.equal(width.codePointWidth("A".codePointAt(0)!), 1);
  assert.equal(width.codePointWidth(0x00ad), 0);
  assert.equal(width.codePointWidth(0x0300), 0);
  assert.equal(width.codePointWidth(0x0591), 1);
  assert.equal(width.codePointWidth(0x070f), 0);
  assert.equal(width.codePointWidth(0x093f), 1);
  assert.equal(width.codePointWidth(0x0cf3), 0);
  assert.equal(width.codePointWidth(0x115f), 2);
  assert.equal(width.codePointWidth(0x20e3), 0);
  assert.equal(width.codePointWidth(0x4e00), 2);
  assert.equal(width.codePointWidth(0x1f1e6), 1);
  assert.equal(width.codePointWidth(0x2a6e0), 2);
});

test("emoji and wcwidth code point properties", () => {
  assert.equal(isEmojiPresentation(0x1f600), true);
  assert.equal(isExtendedPictographic(0x1f600), true);
  assert.equal(width.codePointWidth(0), 0);
  assert.equal(width.codePointWidth(0x00a1), 1);
  assert.equal(width.codePointWidth(0x4e00), 2);
});

test("grapheme iterator examples", () => {
  const str = "👩🏽‍🚀🇨🇭👨🏻‍🍼";
  const it = grapheme.graphemes(str);
  assert.deepEqual(it.peekSegment(), { segment: "👩🏽‍🚀", start: 0, end: 7 });
  assert.deepEqual(it.nextSegment(), { segment: "👩🏽‍🚀", start: 0, end: 7 });
  assert.deepEqual(it.nextSegment(), { segment: "🇨🇭", start: 7, end: 11 });
  assert.deepEqual(it.peekSegment(), { segment: "👨🏻‍🍼", start: 11, end: 18 });
  assert.deepEqual(it.nextSegment(), { segment: "👨🏻‍🍼", start: 11, end: 18 });
  assert.equal(it.nextSegment(), null);
  assert.deepEqual(
    [...graphemes(str)].map((item) => item.segment),
    ["👩🏽‍🚀", "🇨🇭", "👨🏻‍🍼"],
  );
});

test("line iterator examples", () => {
  for (const { input, want } of [
    { input: "", want: [] },
    { input: "hello", want: [{ start: 0, end: 5, break: "must_break" }] },
    {
      input: "hello world",
      want: [
        { start: 0, end: 6, break: "can_break" },
        { start: 6, end: 11, break: "must_break" },
      ],
    },
    {
      input: "a\nb",
      want: [
        { start: 0, end: 2, break: "must_break" },
        { start: 2, end: 3, break: "must_break" },
      ],
    },
    {
      input: "a\r\nb",
      want: [
        { start: 0, end: 3, break: "must_break" },
        { start: 3, end: 4, break: "must_break" },
      ],
    },
    { input: "A.B", want: [{ start: 0, end: 3, break: "must_break" }] },
    {
      input: "👩‍🚀x",
      want: [
        { start: 0, end: "👩‍🚀".length, break: "can_break" },
        { start: "👩‍🚀".length, end: "👩‍🚀x".length, break: "must_break" },
      ],
    },
  ] as const) {
    assert.deepEqual([...lineSegments(input)], want, input);
  }

  const it = lineSegments("hello world");
  assert.deepEqual(it.peekSegment(), { start: 0, end: 6, break: "can_break" });
  assert.deepEqual(it.nextSegment(), { start: 0, end: 6, break: "can_break" });
  assert.deepEqual(it.nextSegment(), { start: 6, end: 11, break: "must_break" });
  assert.equal(it.nextSegment(), null);
});

test("line break test data", () => {
  const lines = readFileSync("ucd/auxiliary/LineBreakTest.txt", "utf8").split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    const body = line.split("#", 1)[0]!.trim();
    if (!body) continue;

    const tokens = body.split(/\s+/);
    let input = "";
    let offset = 0;
    const expectedEnds: number[] = [];

    for (let i = 1; i < tokens.length; i += 2) {
      const hex = tokens[i];
      const marker = tokens[i + 1];
      if (!hex || !marker) break;
      const cp = Number.parseInt(hex, 16);
      const char = codePointToString(cp);
      input += char;
      offset += char.length;
      if (marker === "÷") expectedEnds.push(offset);
    }

    const actualEnds = [...lineSegments(input)].map((segment) => segment.end);
    assert.deepEqual(actualEnds, expectedEnds, `line ${lineIndex + 1}: ${line}`);
  }
});

test("grapheme break test data", () => {
  const lines = readFileSync("ucd/auxiliary/GraphemeBreakTest.txt", "utf8").split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    const body = line.split("#", 1)[0]!.trim();
    if (!body) continue;
    const parts = body.split(/\s+/);
    assert.equal(parts.shift(), "÷");
    let cp1 = Number.parseInt(parts.shift()!, 16);
    let expected = parts.shift()!;
    let cp2 = Number.parseInt(parts.shift()!, 16);
    const state = { value: "default" as grapheme.BreakState };
    while (parts.length > 0) {
      let expectedBreak = expected === "÷";
      const gb1 = graphemeBreakProperty(cp1);
      const gb2 = graphemeBreakProperty(cp2);
      if (gb2 === "emoji_modifier" && gb1 !== "emoji_modifier_base") expectedBreak = true;
      assert.equal(
        grapheme.isBreak(cp1, cp2, state),
        expectedBreak,
        `line ${lineIndex + 1}: ${cp1.toString(16)} ${cp2.toString(16)}`,
      );
      cp1 = cp2;
      expected = parts.shift()!;
      if (parts.length === 0) break;
      cp2 = Number.parseInt(parts.shift()!, 16);
    }
  }
});

function codePointToString(cp: number): string {
  return cp >= 0xd800 && cp <= 0xdfff ? String.fromCharCode(cp) : String.fromCodePoint(cp);
}

test("grapheme break no control test data", () => {
  const lines = readFileSync("ucd/auxiliary/GraphemeBreakTest.txt", "utf8").split(/\r?\n/);
  lineLoop: for (const [lineIndex, line] of lines.entries()) {
    const body = line.split("#", 1)[0]!.trim();
    if (!body) continue;
    const parts = body.split(/\s+/);
    assert.equal(parts.shift(), "÷");
    let cp1 = Number.parseInt(parts.shift()!, 16);
    let expected = parts.shift()!;
    let cp2 = Number.parseInt(parts.shift()!, 16);
    if (
      ["control", "cr", "lf"].includes(graphemeBreakProperty(cp1)) ||
      ["control", "cr", "lf"].includes(graphemeBreakProperty(cp2))
    )
      continue;
    const state = { value: "default" as grapheme.BreakState };
    while (parts.length > 0) {
      let expectedBreak = expected === "÷";
      const gb1 = toNoControlBreak(graphemeBreakProperty(cp1));
      const gb2 = toNoControlBreak(graphemeBreakProperty(cp2));
      if (gb2 === "emoji_modifier" && gb1 !== "emoji_modifier_base") expectedBreak = true;
      assert.equal(
        grapheme.isBreakNoControl(cp1, cp2, state),
        expectedBreak,
        `line ${lineIndex + 1}: ${cp1.toString(16)} ${cp2.toString(16)}`,
      );
      cp1 = cp2;
      expected = parts.shift()!;
      if (parts.length === 0) break;
      cp2 = Number.parseInt(parts.shift()!, 16);
      if (["control", "cr", "lf"].includes(graphemeBreakProperty(cp2))) continue lineLoop;
    }
  }
});

test("width API matches uucode wcwidth samples", () => {
  for (const [sample, want] of [
    ["ò👨🏻‍❤️‍👨🏿_", 4],
    ["A\u{0300}B", 2],
    ["😀AB", 4],
    ["\u200b", 0],
    ["\u{20e3}", 0],
    ["\u{1f1e6}", 1],
    ["\u{1f466}\u{1f3fb}", 2],
    ["\u{2601}\u{fe0f}", 2],
    ["\u{2601}\u{fe0e}", 1],
    ["1\u{fe0f}\u{20e3}", 2],
    ["\u{1f1fa}\u{1f1f8}", 2],
    ["\u{1f469}\u{200d}\u{1f469}\u{200d}\u{1f467}\u{200d}\u{1f466}_", 3],
    ["\u{1100}\u{1161}\u{11a8}", 2],
    ["क्‍ष", 2],
    ["\u0000A", 1],
    ["ABC", 3],
  ] as const) {
    assert.equal(stringWidth(sample), want, sample);
    assert.equal(width.stringWidth(sample), want, sample);
  }
  assert.equal(width.codePointWidth(0x3000), 2);
  assert.equal(width.codePointWidth(0), 0);
});
