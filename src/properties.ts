import type {
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakProperty,
  LineBreak,
  SentenceBreak,
  WordBreak,
} from "./generated/types.js";
import {
  GC_LETTER_LOWERCASE,
  GC_LETTER_MODIFIER,
  GC_LETTER_OTHER,
  GC_LETTER_TITLECASE,
  GC_LETTER_UPPERCASE,
  GC_MARK_ENCLOSING,
  GC_MARK_NONSPACING,
  GC_MARK_SPACING_COMBINING,
  GC_NUMBER_DECIMAL_DIGIT,
  GC_NUMBER_LETTER,
  GC_NUMBER_OTHER,
  GC_PUNCTUATION_CLOSE,
  GC_PUNCTUATION_CONNECTOR,
  GC_PUNCTUATION_DASH,
  GC_PUNCTUATION_FINAL_QUOTE,
  GC_PUNCTUATION_INITIAL_QUOTE,
  GC_PUNCTUATION_OPEN,
  GC_PUNCTUATION_OTHER,
  GC_SEPARATOR_SPACE,
  GC_SYMBOL_CURRENCY,
  GC_SYMBOL_MATH,
  GC_SYMBOL_MODIFIER,
  GC_SYMBOL_OTHER,
  MAX_CODE_POINT,
  eastAsianWidthCode,
  eastAsianWidthName,
  generalCategoryCode,
  generalCategoryName,
  graphemeBreakCode,
  graphemeBreakName,
  isDashCode,
  isDiacriticCode,
  isEmojiPresentationCode,
  isExtendedPictographicCode,
  isHexDigitCode,
  isPatternSyntaxCode,
  isPatternWhiteSpaceCode,
  isQuotationMarkCode,
  isUnifiedIdeographCode,
  isVariationSelectorCode,
  isWhiteSpaceCode,
  lineBreakCode,
  lineBreakName,
  sentenceBreakCode,
  sentenceBreakName,
  simpleFoldCode,
  simpleFoldKeyCode,
  toLowerCode,
  toTitleCode,
  toUpperCode,
  wordBreakCode,
  wordBreakName,
} from "./runtime.js";

export type {
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakProperty,
  LineBreak,
  SentenceBreak,
  WordBreak,
} from "./generated/types.js";

export type CodePoint = number;

function assertCodePoint(cp: number): void {
  if (!Number.isInteger(cp) || cp < 0 || cp > MAX_CODE_POINT) {
    throw new RangeError(`Invalid Unicode code point: ${cp}`);
  }
}

export function generalCategory(cp: number): GeneralCategory {
  assertCodePoint(cp);
  return generalCategoryName(generalCategoryCode(cp)) as GeneralCategory;
}

export function eastAsianWidth(cp: number): EastAsianWidth {
  assertCodePoint(cp);
  return eastAsianWidthName(eastAsianWidthCode(cp)) as EastAsianWidth;
}

export function wordBreak(cp: number): WordBreak {
  assertCodePoint(cp);
  return wordBreakName(wordBreakCode(cp)) as WordBreak;
}

export function sentenceBreak(cp: number): SentenceBreak {
  assertCodePoint(cp);
  return sentenceBreakName(sentenceBreakCode(cp)) as SentenceBreak;
}

export function lineBreak(cp: number): LineBreak {
  assertCodePoint(cp);
  return lineBreakName(lineBreakCode(cp)) as LineBreak;
}

export function graphemeBreakProperty(cp: number): GraphemeBreakProperty {
  assertCodePoint(cp);
  return graphemeBreakName(graphemeBreakCode(cp)) as GraphemeBreakProperty;
}

export function toUpper(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x20;
  return toUpperCode(cp);
}

export function toLower(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x41 && cp <= 0x5a) return cp + 0x20;
  return toLowerCode(cp);
}

export function toTitle(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x20;
  return toTitleCode(cp);
}

export function simpleFold(cp: number): number {
  assertCodePoint(cp);
  if (cp >= 0x41 && cp <= 0x4a) return cp + 0x20;
  if (cp >= 0x4c && cp <= 0x5a) return cp + 0x20;
  if (cp >= 0x61 && cp <= 0x6a) return cp - 0x20;
  if (cp >= 0x6c && cp <= 0x7a) return cp - 0x20;
  return simpleFoldCode(cp);
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
  return simpleFoldKeyCode(cp);
}

export function isUpper(cp: number): boolean {
  assertCodePoint(cp);
  return generalCategoryCode(cp) === GC_LETTER_UPPERCASE;
}

export function isLower(cp: number): boolean {
  assertCodePoint(cp);
  return generalCategoryCode(cp) === GC_LETTER_LOWERCASE;
}

export function isTitle(cp: number): boolean {
  assertCodePoint(cp);
  return generalCategoryCode(cp) === GC_LETTER_TITLECASE;
}

export function isLetter(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_LETTER_UPPERCASE:
    case GC_LETTER_LOWERCASE:
    case GC_LETTER_TITLECASE:
    case GC_LETTER_MODIFIER:
    case GC_LETTER_OTHER:
      return true;
    default:
      return false;
  }
}

export function isNumber(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_NUMBER_DECIMAL_DIGIT:
    case GC_NUMBER_LETTER:
    case GC_NUMBER_OTHER:
      return true;
    default:
      return false;
  }
}

export function isDigit(cp: number): boolean {
  assertCodePoint(cp);
  return generalCategoryCode(cp) === GC_NUMBER_DECIMAL_DIGIT;
}

export function isMark(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_MARK_NONSPACING:
    case GC_MARK_SPACING_COMBINING:
    case GC_MARK_ENCLOSING:
      return true;
    default:
      return false;
  }
}

export function isPunct(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_PUNCTUATION_CONNECTOR:
    case GC_PUNCTUATION_DASH:
    case GC_PUNCTUATION_OPEN:
    case GC_PUNCTUATION_CLOSE:
    case GC_PUNCTUATION_INITIAL_QUOTE:
    case GC_PUNCTUATION_FINAL_QUOTE:
    case GC_PUNCTUATION_OTHER:
      return true;
    default:
      return false;
  }
}

export function isSymbol(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_SYMBOL_MATH:
    case GC_SYMBOL_CURRENCY:
    case GC_SYMBOL_MODIFIER:
    case GC_SYMBOL_OTHER:
      return true;
    default:
      return false;
  }
}

export function isGraphic(cp: number): boolean {
  assertCodePoint(cp);
  switch (generalCategoryCode(cp)) {
    case GC_LETTER_UPPERCASE:
    case GC_LETTER_LOWERCASE:
    case GC_LETTER_TITLECASE:
    case GC_LETTER_MODIFIER:
    case GC_LETTER_OTHER:
    case GC_MARK_NONSPACING:
    case GC_MARK_SPACING_COMBINING:
    case GC_MARK_ENCLOSING:
    case GC_NUMBER_DECIMAL_DIGIT:
    case GC_NUMBER_LETTER:
    case GC_NUMBER_OTHER:
    case GC_PUNCTUATION_CONNECTOR:
    case GC_PUNCTUATION_DASH:
    case GC_PUNCTUATION_OPEN:
    case GC_PUNCTUATION_CLOSE:
    case GC_PUNCTUATION_INITIAL_QUOTE:
    case GC_PUNCTUATION_FINAL_QUOTE:
    case GC_PUNCTUATION_OTHER:
    case GC_SYMBOL_MATH:
    case GC_SYMBOL_CURRENCY:
    case GC_SYMBOL_MODIFIER:
    case GC_SYMBOL_OTHER:
    case GC_SEPARATOR_SPACE:
      return true;
    default:
      return false;
  }
}

export function isPrint(cp: number): boolean {
  assertCodePoint(cp);
  if (cp === 0x20) return true;
  switch (generalCategoryCode(cp)) {
    case GC_LETTER_UPPERCASE:
    case GC_LETTER_LOWERCASE:
    case GC_LETTER_TITLECASE:
    case GC_LETTER_MODIFIER:
    case GC_LETTER_OTHER:
    case GC_MARK_NONSPACING:
    case GC_MARK_SPACING_COMBINING:
    case GC_MARK_ENCLOSING:
    case GC_NUMBER_DECIMAL_DIGIT:
    case GC_NUMBER_LETTER:
    case GC_NUMBER_OTHER:
    case GC_PUNCTUATION_CONNECTOR:
    case GC_PUNCTUATION_DASH:
    case GC_PUNCTUATION_OPEN:
    case GC_PUNCTUATION_CLOSE:
    case GC_PUNCTUATION_INITIAL_QUOTE:
    case GC_PUNCTUATION_FINAL_QUOTE:
    case GC_PUNCTUATION_OTHER:
    case GC_SYMBOL_MATH:
    case GC_SYMBOL_CURRENCY:
    case GC_SYMBOL_MODIFIER:
    case GC_SYMBOL_OTHER:
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
  return isWhiteSpaceCode(cp);
}

export function isASCIIHexDigit(cp: number): boolean {
  assertCodePoint(cp);
  if (cp > 0x7f) return false;
  const folded = cp | 0x20;
  return (cp >= 0x30 && cp <= 0x39) || (folded >= 0x61 && folded <= 0x66);
}

export function isHexDigit(cp: number): boolean {
  assertCodePoint(cp);
  return isHexDigitCode(cp);
}

export function isDash(cp: number): boolean {
  assertCodePoint(cp);
  return isDashCode(cp);
}

export function isDiacritic(cp: number): boolean {
  assertCodePoint(cp);
  return isDiacriticCode(cp);
}

export function isQuotationMark(cp: number): boolean {
  assertCodePoint(cp);
  return isQuotationMarkCode(cp);
}

export function isPatternSyntax(cp: number): boolean {
  assertCodePoint(cp);
  return isPatternSyntaxCode(cp);
}

export function isPatternWhiteSpace(cp: number): boolean {
  assertCodePoint(cp);
  return isPatternWhiteSpaceCode(cp);
}

export function isVariationSelector(cp: number): boolean {
  assertCodePoint(cp);
  return isVariationSelectorCode(cp);
}

export function isNoncharacter(cp: number): boolean {
  assertCodePoint(cp);
  if (cp >= 0xfdd0 && cp <= 0xfdef) return true;
  return (cp & 0xfffe) === 0xfffe && cp >= 0xfffe && cp <= 0x10ffff;
}

export function isUnifiedIdeograph(cp: number): boolean {
  assertCodePoint(cp);
  return isUnifiedIdeographCode(cp);
}

export function isEmojiPresentation(cp: number): boolean {
  assertCodePoint(cp);
  return isEmojiPresentationCode(cp);
}

export function isExtendedPictographic(cp: number): boolean {
  assertCodePoint(cp);
  return isExtendedPictographicCode(cp);
}
