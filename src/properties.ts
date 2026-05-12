import { tables } from "./generated/tables.js";
import type {
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakProperty,
  LineBreak,
  SentenceBreak,
  WordBreak,
} from "./get.js";

type NumberMapEntries = readonly (readonly [number, number])[];

const simpleUppercaseMap = new Map(tables.maps["simple_uppercase_mapping"] as NumberMapEntries);
const simpleLowercaseMap = new Map(tables.maps["simple_lowercase_mapping"] as NumberMapEntries);
const simpleTitlecaseMap = new Map(tables.maps["simple_titlecase_mapping"] as NumberMapEntries);
const simpleFoldMap = new Map(tables.maps["simple_fold"] as NumberMapEntries);
const simpleFoldKeyMap = new Map(tables.maps["simple_fold_key"] as NumberMapEntries);

export type {
  CodePoint,
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakProperty,
  LineBreak,
  SentenceBreak,
  WordBreak,
} from "./get.js";

function assertCodePoint(cp: number): void {
  if (!Number.isInteger(cp) || cp < 0 || cp > tables.maxCodePoint) {
    throw new RangeError(`Invalid Unicode code point: ${cp}`);
  }
}

function rangeValue<T>(field: string, cp: number, defaultValue: T): T {
  const ranges = tables.ranges[field] as readonly (readonly [number, number, T])[];
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end, value] = ranges[mid]!;
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return value;
  }
  return defaultValue;
}

function mapNumber(values: ReadonlyMap<number, number>, cp: number, defaultValue: number): number {
  return values.get(cp) ?? defaultValue;
}

export function generalCategory(cp: number): GeneralCategory {
  assertCodePoint(cp);
  if (cp >= 0 && cp <= 0x7f) return asciiGeneralCategory(cp);
  return rangeValue("general_category", cp, "other_not_assigned");
}

export function eastAsianWidth(cp: number): EastAsianWidth {
  assertCodePoint(cp);
  if (cp >= 0 && cp <= 0x7f) return cp < 0x20 || cp === 0x7f ? "neutral" : "narrow";
  return rangeValue("east_asian_width", cp, "neutral");
}

export function wordBreak(cp: number): WordBreak {
  assertCodePoint(cp);
  return rangeValue("word_break", cp, "other");
}

export function sentenceBreak(cp: number): SentenceBreak {
  assertCodePoint(cp);
  return rangeValue("sentence_break", cp, "other");
}

export function lineBreak(cp: number): LineBreak {
  assertCodePoint(cp);
  return rangeValue("line_break", cp, "xx");
}

export function graphemeBreakProperty(cp: number): GraphemeBreakProperty {
  assertCodePoint(cp);
  return rangeValue("grapheme_break", cp, "other");
}

export function toUpper(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x20;
  return mapNumber(simpleUppercaseMap, cp, cp);
}

export function toLower(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x41 && cp <= 0x5a) return cp + 0x20;
  return mapNumber(simpleLowercaseMap, cp, cp);
}

export function toTitle(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x20;
  return mapNumber(simpleTitlecaseMap, cp, cp);
}

export function simpleFold(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x41 && cp <= 0x4a) return cp + 0x20;
  if (cp >= 0x4c && cp <= 0x5a) return cp + 0x20;
  if (cp >= 0x61 && cp <= 0x6a) return cp - 0x20;
  if (cp >= 0x6c && cp <= 0x7a) return cp - 0x20;
  return mapNumber(simpleFoldMap, cp, cp);
}

export function equalFold(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  if (a.length === 1) {
    const ca = a.charCodeAt(0);
    const cb = b.charCodeAt(0);
    if ((ca | cb) < 0x80) {
      const folded = ca | 0x20;
      return folded >= 0x61 && folded <= 0x7a && folded === (cb | 0x20);
    }
    return simpleFoldKey(ca) === simpleFoldKey(cb);
  }

  let i = 0;
  for (; i < a.length; i += 1) {
    const ca = a.charCodeAt(i);
    const cb = b.charCodeAt(i);
    if ((ca | cb) >= 0x80) break;
    if (ca === cb) continue;
    const folded = ca | 0x20;
    if (folded < 0x61 || folded > 0x7a || folded !== (cb | 0x20)) return false;
  }
  if (i === a.length) return true;

  let ia = i;
  let ib = i;
  while (ia < a.length && ib < b.length) {
    const ca = a.codePointAt(ia)!;
    const cb = b.codePointAt(ib)!;
    ia += ca > 0xffff ? 2 : 1;
    ib += cb > 0xffff ? 2 : 1;
    if (ca === cb) continue;
    const lower = ca < cb ? ca : cb;
    const upper = ca < cb ? cb : ca;
    if (upper < 0x80) {
      const folded = lower | 0x20;
      if (folded < 0x61 || folded > 0x7a || folded !== (upper | 0x20)) return false;
      continue;
    }
    if (simpleFoldKey(lower) !== simpleFoldKey(upper)) return false;
  }
  return ia === a.length && ib === b.length;
}

function simpleFoldKey(cp: number): number {
  if (cp >= 0x41 && cp <= 0x5a) return cp;
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x20;
  return mapNumber(simpleFoldKeyMap, cp, cp);
}

export function isUpper(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x41 && cp <= 0x5a;
  return generalCategory(cp) === "letter_uppercase";
}

export function isLower(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x61 && cp <= 0x7a;
  return generalCategory(cp) === "letter_lowercase";
}

export function isTitle(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return false;
  return generalCategory(cp) === "letter_titlecase";
}

export function isLetter(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return (cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a);
  switch (generalCategory(cp)) {
    case "letter_uppercase":
    case "letter_lowercase":
    case "letter_titlecase":
    case "letter_modifier":
    case "letter_other":
      return true;
    default:
      return false;
  }
}

export function isNumber(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x30 && cp <= 0x39;
  switch (generalCategory(cp)) {
    case "number_decimal_digit":
    case "number_letter":
    case "number_other":
      return true;
    default:
      return false;
  }
}

export function isDigit(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x30 && cp <= 0x39;
  return generalCategory(cp) === "number_decimal_digit";
}

export function isMark(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return false;
  switch (generalCategory(cp)) {
    case "mark_nonspacing":
    case "mark_spacing_combining":
    case "mark_enclosing":
      return true;
    default:
      return false;
  }
}

export function isPunct(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return isAsciiPunct(cp);
  switch (generalCategory(cp)) {
    case "punctuation_connector":
    case "punctuation_dash":
    case "punctuation_open":
    case "punctuation_close":
    case "punctuation_initial_quote":
    case "punctuation_final_quote":
    case "punctuation_other":
      return true;
    default:
      return false;
  }
}

export function isSymbol(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return isAsciiSymbol(cp);
  switch (generalCategory(cp)) {
    case "symbol_math":
    case "symbol_currency":
    case "symbol_modifier":
    case "symbol_other":
      return true;
    default:
      return false;
  }
}

export function isGraphic(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x20 && cp <= 0x7e;
  switch (generalCategory(cp)) {
    case "letter_uppercase":
    case "letter_lowercase":
    case "letter_titlecase":
    case "letter_modifier":
    case "letter_other":
    case "mark_nonspacing":
    case "mark_spacing_combining":
    case "mark_enclosing":
    case "number_decimal_digit":
    case "number_letter":
    case "number_other":
    case "punctuation_connector":
    case "punctuation_dash":
    case "punctuation_open":
    case "punctuation_close":
    case "punctuation_initial_quote":
    case "punctuation_final_quote":
    case "punctuation_other":
    case "symbol_math":
    case "symbol_currency":
    case "symbol_modifier":
    case "symbol_other":
    case "separator_space":
      return true;
    default:
      return false;
  }
}

export function isPrint(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp >= 0x20 && cp <= 0x7e;
  switch (generalCategory(cp)) {
    case "letter_uppercase":
    case "letter_lowercase":
    case "letter_titlecase":
    case "letter_modifier":
    case "letter_other":
    case "mark_nonspacing":
    case "mark_spacing_combining":
    case "mark_enclosing":
    case "number_decimal_digit":
    case "number_letter":
    case "number_other":
    case "punctuation_connector":
    case "punctuation_dash":
    case "punctuation_open":
    case "punctuation_close":
    case "punctuation_initial_quote":
    case "punctuation_final_quote":
    case "punctuation_other":
    case "symbol_math":
    case "symbol_currency":
    case "symbol_modifier":
    case "symbol_other":
      return true;
    default:
      return false;
  }
}

export function isControl(cp: number): boolean {
  assertCodePoint(cp);
  return (cp >= 0 && cp <= 0x1f) || (cp >= 0x7f && cp <= 0x9f);
}

export function isSpace(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp === 0x20 || (cp >= 0x09 && cp <= 0x0d);
  return rangeValue("is_white_space", cp, false);
}

export function isASCIIHexDigit(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) {
    const folded = cp | 0x20;
    return (cp >= 0x30 && cp <= 0x39) || (folded >= 0x61 && folded <= 0x66);
  }
  return false;
}

export function isHexDigit(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) {
    const folded = cp | 0x20;
    return (cp >= 0x30 && cp <= 0x39) || (folded >= 0x61 && folded <= 0x66);
  }
  return rangeValue("is_hex_digit", cp, false);
}

export function isDash(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp === 0x2d;
  return rangeValue("is_dash", cp, false);
}

export function isDiacritic(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp === 0x5e || cp === 0x60;
  return rangeValue("is_diacritic", cp, false);
}

export function isQuotationMark(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp === 0x22 || cp === 0x27;
  return rangeValue("is_quotation_mark", cp, false);
}

export function isPatternSyntax(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return isAsciiPatternSyntax(cp);
  return rangeValue("is_pattern_syntax", cp, false);
}

export function isPatternWhiteSpace(cp: number): boolean {
  assertCodePoint(cp);
  if (cp <= 0x7f) return cp === 0x20 || (cp >= 0x09 && cp <= 0x0d);
  return rangeValue("is_pattern_white_space", cp, false);
}

export function isVariationSelector(cp: number): boolean {
  assertCodePoint(cp);
  return rangeValue("is_variation_selector", cp, false);
}

export function isNoncharacter(cp: number): boolean {
  assertCodePoint(cp);
  if (cp >= 0xfdd0 && cp <= 0xfdef) return true;
  return (cp & 0xfffe) === 0xfffe && cp >= 0xfffe && cp <= 0x10ffff;
}

export function isUnifiedIdeograph(cp: number): boolean {
  assertCodePoint(cp);
  return rangeValue("is_unified_ideograph", cp, false);
}

export function isEmojiPresentation(cp: number): boolean {
  assertCodePoint(cp);
  return rangeValue("is_emoji_presentation", cp, false);
}

function isAsciiPunct(cp: number): boolean {
  return (
    (cp >= 0x21 && cp <= 0x23) ||
    cp === 0x25 ||
    (cp >= 0x26 && cp <= 0x2a) ||
    cp === 0x2c ||
    cp === 0x2d ||
    (cp >= 0x2e && cp <= 0x2f) ||
    (cp >= 0x3a && cp <= 0x3b) ||
    (cp >= 0x3f && cp <= 0x40) ||
    (cp >= 0x5b && cp <= 0x5d) ||
    cp === 0x5f ||
    cp === 0x7b ||
    cp === 0x7d
  );
}

function isAsciiSymbol(cp: number): boolean {
  return (
    cp === 0x24 ||
    cp === 0x2b ||
    (cp >= 0x3c && cp <= 0x3e) ||
    cp === 0x5e ||
    cp === 0x60 ||
    cp === 0x7c ||
    cp === 0x7e
  );
}

function isAsciiPatternSyntax(cp: number): boolean {
  return (
    (cp >= 0x21 && cp <= 0x2f) ||
    (cp >= 0x3a && cp <= 0x40) ||
    (cp >= 0x5b && cp <= 0x5e) ||
    cp === 0x60 ||
    (cp >= 0x7b && cp <= 0x7e)
  );
}

export function isExtendedPictographic(cp: number): boolean {
  assertCodePoint(cp);
  return rangeValue("is_extended_pictographic", cp, false);
}

function asciiGeneralCategory(cp: number): GeneralCategory {
  if (cp <= 0x1f || cp === 0x7f) return "other_control";
  if (cp === 0x20) return "separator_space";
  if (cp >= 0x41 && cp <= 0x5a) return "letter_uppercase";
  if (cp >= 0x61 && cp <= 0x7a) return "letter_lowercase";
  if (cp >= 0x30 && cp <= 0x39) return "number_decimal_digit";
  switch (cp) {
    case 0x24:
      return "symbol_currency";
    case 0x2b:
    case 0x3c:
    case 0x3d:
    case 0x3e:
    case 0x7c:
    case 0x7e:
      return "symbol_math";
    case 0x5e:
    case 0x60:
      return "symbol_modifier";
    case 0x28:
    case 0x5b:
    case 0x7b:
      return "punctuation_open";
    case 0x29:
    case 0x5d:
    case 0x7d:
      return "punctuation_close";
    case 0x2d:
      return "punctuation_dash";
    case 0x5f:
      return "punctuation_connector";
    default:
      return "punctuation_other";
  }
}
