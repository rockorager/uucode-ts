import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as ascii from "../src/ascii.js";
import * as grapheme from "../src/grapheme.js";
import * as width from "../src/width.js";
import { get, getProperties, graphemes, stringWidth } from "../src/index.js";
import { getBoolean, getCodePoints, getNumber, getString } from "../src/get.js";
import type { FieldValueFor, GeneralCategory, Script } from "../src/get.js";

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
  assert.equal(getString("name", 65), "LATIN CAPITAL LETTER A");
  assert.equal(getBoolean("is_alphabetic", 65), true);
  assert.equal(getBoolean("is_alphabetic", 0), false);
  assert.equal(get("general_category", 65), "letter_uppercase");
  assert.equal(get("general_category", 0x2200), "symbol_math");
  assert.equal(getNumber("case_folding_simple", 65), 97);
  assert.equal(getNumber("simple_uppercase_mapping", 0x03c2), 0x03a3);
  assert.deepEqual(getCodePoints("uppercase_mapping", 0x00df), [0x0053, 0x0053]);
  assert.deepEqual(getCodePoints("decomposition_mapping", 0x00c0), [0x0041, 0x0300]);
  assert.equal(get("decomposition_type", 0x00c0), "canonical");
  assert.equal(get("decomposition_type", 0xfcc8), "initial");
  assert.deepEqual(getCodePoints("case_folding_full", 0x00df), [0x0073, 0x0073]);
  assert.equal(get("case_folding_turkish_only", 0x0049), 0x0131);
  assert.equal(get("case_folding_common_only", 0x0041), 0x0061);
  assert.equal(get("case_folding_simple_only", 0x1e9e), 0x00df);
  assert.deepEqual(get("case_folding_full_only", 0x00df), [0x0073, 0x0073]);
  assert.deepEqual(getProperties(0x1f600).bidi_paired_bracket, { type: "none" });
  assert.equal(getProperties(0x1f600).is_emoji_presentation, true);
  assert.equal(getBoolean("has_special_casing", 0x00df), true);
  assert.deepEqual(get("special_casing_condition", 0x03a3), ["final_sigma"]);
  assert.deepEqual(getCodePoints("special_lowercase_mapping", 0x00df), [0x00df]);
  assert.deepEqual(getCodePoints("special_titlecase_mapping", 0x00df), [0x0053, 0x0073]);
  assert.deepEqual(getCodePoints("special_uppercase_mapping", 0x00df), [0x0053, 0x0053]);
  assert.deepEqual(getCodePoints("special_lowercase_mapping_conditional", 0x03a3), [0x03c2]);
  assert.deepEqual(getCodePoints("special_titlecase_mapping_conditional", 0x03a3), [0x03a3]);
  assert.deepEqual(getCodePoints("special_uppercase_mapping_conditional", 0x03a3), [0x03a3]);
});

test("categorical Unicode properties expose literal union types", () => {
  const category: GeneralCategory = get("general_category", 0x2200);
  const categoryFromMap: FieldValueFor<"general_category"> = category;
  const script: Script = get("script", 0x03b1);
  assert.equal(categoryFromMap, "symbol_math");
  assert.equal(script, "greek");
});

test("misc Unicode properties", () => {
  assert.equal(get("bidi_class", 0x0600), "arabic_number");
  assert.equal(get("block", 0x0041), "basic_latin");
  assert.equal(get("block", 0x03b1), "greek_and_coptic");
  assert.equal(get("script", 0x0041), "latin");
  assert.equal(get("script", 0x03b1), "greek");
  assert.equal(get("script", 0x4e00), "han");
  assert.equal(get("joining_type", 0x0628), "dual_joining");
  assert.equal(get("joining_group", 0x0628), "beh");
  assert.equal(get("indic_positional_category", 0x0a81), "top");
  assert.equal(get("indic_syllabic_category", 0x0a97), "consonant");
  assert.equal(get("east_asian_width", 0xff01), "fullwidth");
  assert.equal(getNumber("canonical_combining_class", 0x0300), 230);
  assert.equal(get("numeric_type", 0x00bd), "numeric");
  assert.equal(get("numeric_value_decimal", 0x0035), 5);
  assert.equal(get("numeric_value_digit", 0x00b2), 2);
  assert.equal(getBoolean("is_bidi_mirrored", 0x0028), true);
  assert.equal(getString("unicode_1_name", 0), "NULL");
  assert.equal(get("bidi_mirroring", 0x0028), 0x0029);
  assert.deepEqual(get("bidi_paired_bracket", 0x0028), { type: "open", codePoint: 0x0029 });
  assert.deepEqual(get("bidi_paired_bracket", 0x2998), { type: "close", codePoint: 0x2997 });
});

test("derived boolean properties", () => {
  assert.equal(getBoolean("is_math", 0x002b), true);
  assert.equal(getBoolean("is_cased", 0x0041), true);
  assert.equal(getBoolean("is_case_ignorable", 0x0027), true);
  assert.equal(getBoolean("changes_when_lowercased", 0x0041), true);
  assert.equal(getBoolean("changes_when_uppercased", 0x0061), true);
  assert.equal(getBoolean("changes_when_titlecased", 0x0061), true);
  assert.equal(getBoolean("changes_when_casefolded", 0x0041), true);
  assert.equal(getBoolean("changes_when_casemapped", 0x0041), true);
  assert.equal(getBoolean("is_id_start", 0x0041), true);
  assert.equal(getBoolean("is_id_continue", 0x0030), true);
  assert.equal(getBoolean("is_xid_start", 0x0041), true);
  assert.equal(getBoolean("is_xid_continue", 0x0030), true);
  assert.equal(getBoolean("is_default_ignorable", 0x00ad), true);
  assert.equal(getBoolean("is_grapheme_extend", 0x0300), true);
  assert.equal(getBoolean("is_grapheme_base", 0x0041), true);
  assert.equal(getBoolean("is_grapheme_link", 0x094d), true);
  assert.equal(get("indic_conjunct_break", 0x094d), "linker");
  assert.equal(get("original_grapheme_break", 0x000d), "cr");
});

test("emoji and wcwidth code point properties", () => {
  assert.equal(getBoolean("is_emoji", 0x1f600), true);
  assert.equal(getBoolean("is_emoji_presentation", 0x1f600), true);
  assert.equal(getBoolean("is_emoji_modifier", 0x1f3fb), true);
  assert.equal(getBoolean("is_emoji_component", 0x1f3fb), true);
  assert.equal(getBoolean("is_extended_pictographic", 0x1f600), true);
  assert.equal(getBoolean("is_emoji_vs_base", 0x231b), true);
  assert.equal(getNumber("wcwidth_standalone", 0), 0);
  assert.equal(getNumber("wcwidth_standalone", 0x00ad), 1);
  assert.equal(getNumber("wcwidth_standalone", 0x20e3), 2);
  assert.equal(getNumber("wcwidth_standalone", 0x1f1e6), 2);
  assert.equal(getNumber("wcwidth_standalone", 0x2e3b), 3);
  assert.equal(getNumber("wcwidth_standalone", 0x00a1), 1);
  assert.equal(getNumber("wcwidth_standalone", 0x4e00), 2);
  assert.equal(getBoolean("wcwidth_zero_in_grapheme", 0x0300), true);
  assert.equal(getBoolean("wcwidth_zero_in_grapheme", 0x0903), false);
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
      const gb1 = get("grapheme_break", cp1);
      const gb2 = get("grapheme_break", cp2);
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
      ["control", "cr", "lf"].includes(get("grapheme_break", cp1) as string) ||
      ["control", "cr", "lf"].includes(get("grapheme_break", cp2) as string)
    )
      continue;
    const state = { value: "default" as grapheme.BreakState };
    while (parts.length > 0) {
      let expectedBreak = expected === "÷";
      const gb1 = get("grapheme_break_no_control", cp1);
      const gb2 = get("grapheme_break_no_control", cp2);
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
      if (["control", "cr", "lf"].includes(get("grapheme_break", cp2) as string)) continue lineLoop;
    }
  }
});

test("width API matches uucode wcwidth samples", () => {
  for (const [sample, want] of [
    ["ò👨🏻‍❤️‍👨🏿_", 4],
    ["A\u{0300}B", 2],
    ["😀AB", 4],
    ["\u{20e3}", 2],
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
