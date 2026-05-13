import {
  eastAsianWidthIDs,
  generalCategoryIDs,
  graphemeBreakIDs,
  lineBreakIDs,
  runtimeProps,
} from "./generated/runtime_props.js";

export const MAX_CODE_POINT = runtimeProps.maxCodePoint;

export const GB_OTHER = graphemeBreakIDs.other;
export const GB_CONTROL = graphemeBreakIDs.control;
export const GB_PREPEND = graphemeBreakIDs.prepend;
export const GB_CR = graphemeBreakIDs.cr;
export const GB_LF = graphemeBreakIDs.lf;
export const GB_REGIONAL_INDICATOR = graphemeBreakIDs.regional_indicator;
export const GB_SPACING_MARK = graphemeBreakIDs.spacing_mark;
export const GB_L = graphemeBreakIDs.l;
export const GB_V = graphemeBreakIDs.v;
export const GB_T = graphemeBreakIDs.t;
export const GB_LV = graphemeBreakIDs.lv;
export const GB_LVT = graphemeBreakIDs.lvt;
export const GB_ZWJ = graphemeBreakIDs.zwj;
export const GB_ZWNJ = graphemeBreakIDs.zwnj;
export const GB_EXTENDED_PICTOGRAPHIC = graphemeBreakIDs.extended_pictographic;
export const GB_EMOJI_MODIFIER_BASE = graphemeBreakIDs.emoji_modifier_base;
export const GB_EMOJI_MODIFIER = graphemeBreakIDs.emoji_modifier;
export const GB_INDIC_CONJUNCT_EXTEND = graphemeBreakIDs.indic_conjunct_break_extend;
export const GB_INDIC_CONJUNCT_LINKER = graphemeBreakIDs.indic_conjunct_break_linker;
export const GB_INDIC_CONJUNCT_CONSONANT = graphemeBreakIDs.indic_conjunct_break_consonant;

export const GC_OTHER_CONTROL = generalCategoryIDs.other_control;
export const GC_OTHER_SURROGATE = generalCategoryIDs.other_surrogate;
export const GC_SEPARATOR_LINE = generalCategoryIDs.separator_line;
export const GC_SEPARATOR_PARAGRAPH = generalCategoryIDs.separator_paragraph;
export const GC_SEPARATOR_SPACE = generalCategoryIDs.separator_space;
export const GC_LETTER_UPPERCASE = generalCategoryIDs.letter_uppercase;
export const GC_LETTER_LOWERCASE = generalCategoryIDs.letter_lowercase;
export const GC_LETTER_TITLECASE = generalCategoryIDs.letter_titlecase;
export const GC_LETTER_MODIFIER = generalCategoryIDs.letter_modifier;
export const GC_LETTER_OTHER = generalCategoryIDs.letter_other;
export const GC_MARK_NONSPACING = generalCategoryIDs.mark_nonspacing;
export const GC_MARK_SPACING_COMBINING = generalCategoryIDs.mark_spacing_combining;
export const GC_MARK_ENCLOSING = generalCategoryIDs.mark_enclosing;
export const GC_NUMBER_DECIMAL_DIGIT = generalCategoryIDs.number_decimal_digit;
export const GC_NUMBER_LETTER = generalCategoryIDs.number_letter;
export const GC_NUMBER_OTHER = generalCategoryIDs.number_other;
export const GC_PUNCTUATION_CONNECTOR = generalCategoryIDs.punctuation_connector;
export const GC_PUNCTUATION_DASH = generalCategoryIDs.punctuation_dash;
export const GC_PUNCTUATION_OPEN = generalCategoryIDs.punctuation_open;
export const GC_PUNCTUATION_CLOSE = generalCategoryIDs.punctuation_close;
export const GC_PUNCTUATION_INITIAL_QUOTE = generalCategoryIDs.punctuation_initial_quote;
export const GC_PUNCTUATION_FINAL_QUOTE = generalCategoryIDs.punctuation_final_quote;
export const GC_PUNCTUATION_OTHER = generalCategoryIDs.punctuation_other;
export const GC_OTHER_NOT_ASSIGNED = generalCategoryIDs.other_not_assigned;
export const GC_SYMBOL_MATH = generalCategoryIDs.symbol_math;
export const GC_SYMBOL_CURRENCY = generalCategoryIDs.symbol_currency;
export const GC_SYMBOL_MODIFIER = generalCategoryIDs.symbol_modifier;
export const GC_SYMBOL_OTHER = generalCategoryIDs.symbol_other;

export const EAW_FULLWIDTH = eastAsianWidthIDs.fullwidth;
export const EAW_WIDE = eastAsianWidthIDs.wide;
export const EAW_HALFWIDTH = eastAsianWidthIDs.halfwidth;
export const EAW_NARROW = eastAsianWidthIDs.narrow;

export const LB_XX = lineBreakIDs.xx;
export const LB_AI = lineBreakIDs.ai;
export const LB_AK = lineBreakIDs.ak;
export const LB_AL = lineBreakIDs.al;
export const LB_AP = lineBreakIDs.ap;
export const LB_AS = lineBreakIDs.as;
export const LB_B2 = lineBreakIDs.b2;
export const LB_BA = lineBreakIDs.ba;
export const LB_BB = lineBreakIDs.bb;
export const LB_BK = lineBreakIDs.bk;
export const LB_CB = lineBreakIDs.cb;
export const LB_CJ = lineBreakIDs.cj;
export const LB_CL = lineBreakIDs.cl;
export const LB_CM = lineBreakIDs.cm;
export const LB_CP = lineBreakIDs.cp;
export const LB_CR = lineBreakIDs.cr;
export const LB_EB = lineBreakIDs.eb;
export const LB_EM = lineBreakIDs.em;
export const LB_EX = lineBreakIDs.ex;
export const LB_GL = lineBreakIDs.gl;
export const LB_H2 = lineBreakIDs.h2;
export const LB_H3 = lineBreakIDs.h3;
export const LB_HH = lineBreakIDs.hh;
export const LB_HL = lineBreakIDs.hl;
export const LB_HY = lineBreakIDs.hy;
export const LB_ID = lineBreakIDs.id;
export const LB_IN = lineBreakIDs.in;
export const LB_IS = lineBreakIDs.is;
export const LB_JL = lineBreakIDs.jl;
export const LB_JT = lineBreakIDs.jt;
export const LB_JV = lineBreakIDs.jv;
export const LB_LF = lineBreakIDs.lf;
export const LB_NL = lineBreakIDs.nl;
export const LB_NS = lineBreakIDs.ns;
export const LB_NU = lineBreakIDs.nu;
export const LB_OP = lineBreakIDs.op;
export const LB_PO = lineBreakIDs.po;
export const LB_PR = lineBreakIDs.pr;
export const LB_QU = lineBreakIDs.qu;
export const LB_RI = lineBreakIDs.ri;
export const LB_SA = lineBreakIDs.sa;
export const LB_SG = lineBreakIDs.sg;
export const LB_SP = lineBreakIDs.sp;
export const LB_SY = lineBreakIDs.sy;
export const LB_VF = lineBreakIDs.vf;
export const LB_VI = lineBreakIDs.vi;
export const LB_WJ = lineBreakIDs.wj;
export const LB_ZW = lineBreakIDs.zw;
export const LB_ZWJ = lineBreakIDs.zwj;

export const BREAK_STATE_DEFAULT = 0;
export const BREAK_STATE_REGIONAL_INDICATOR = 1;
export const BREAK_STATE_EXTENDED_PICTOGRAPHIC = 2;
export const BREAK_STATE_INDIC_CONJUNCT_CONSONANT = 3;
export const BREAK_STATE_INDIC_CONJUNCT_LINKER = 4;

export function runtimeRowIndex(cp: number): number {
  if (!Number.isInteger(cp) || cp < 0 || cp > runtimeProps.maxCodePoint) return 0;
  const stage2Offset = runtimeProps.stage1[cp >> runtimeProps.stage1Shift]!;
  return runtimeProps.stage2[stage2Offset + (cp & runtimeProps.stage2Mask)]!;
}

export function generalCategoryCode(cp: number): number {
  return runtimeProps.gc[runtimeRowIndex(cp)]!;
}

export function eastAsianWidthCode(cp: number): number {
  return runtimeProps.eaw[runtimeRowIndex(cp)]!;
}

export function wordBreakCode(cp: number): number {
  return runtimeProps.wb[runtimeRowIndex(cp)]!;
}

export function sentenceBreakCode(cp: number): number {
  return runtimeProps.sb[runtimeRowIndex(cp)]!;
}

export function lineBreakCode(cp: number): number {
  return runtimeProps.lb[runtimeRowIndex(cp)]!;
}

export function graphemeBreakCode(cp: number): number {
  return runtimeProps.gb[runtimeRowIndex(cp)]!;
}

export function codePointWidthCode(cp: number): number {
  return runtimeProps.width[runtimeRowIndex(cp)]! & runtimeProps.widthMask;
}

export function toUpperCode(cp: number): number {
  const row = runtimeRowIndex(cp);
  return cp + runtimeProps.upperDelta[row]!;
}

export function toLowerCode(cp: number): number {
  const row = runtimeRowIndex(cp);
  return cp + runtimeProps.lowerDelta[row]!;
}

export function toTitleCode(cp: number): number {
  const row = runtimeRowIndex(cp);
  return cp + runtimeProps.titleDelta[row]!;
}

export function simpleFoldCode(cp: number): number {
  const row = runtimeRowIndex(cp);
  return cp + runtimeProps.foldDelta[row]!;
}

export function simpleFoldKeyCode(cp: number): number {
  const row = runtimeRowIndex(cp);
  return cp + runtimeProps.foldKeyDelta[row]!;
}

export function isWhiteSpaceCode(cp: number): boolean {
  return (runtimeProps.flags[runtimeRowIndex(cp)]! & runtimeProps.whiteSpaceFlag) !== 0;
}

export function isASCIIHexDigitCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.asciiHexDigitFlag) !== 0;
}

export function isHexDigitCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.hexDigitFlag) !== 0;
}

export function isDashCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.dashFlag) !== 0;
}

export function isDiacriticCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.diacriticFlag) !== 0;
}

export function isQuotationMarkCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.quotationMarkFlag) !== 0;
}

export function isPatternSyntaxCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.patternSyntaxFlag) !== 0;
}

export function isPatternWhiteSpaceCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.patternWhiteSpaceFlag) !== 0;
}

export function isVariationSelectorCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.variationSelectorFlag) !== 0;
}

export function isNoncharacterCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.noncharacterFlag) !== 0;
}

export function isUnifiedIdeographCode(cp: number): boolean {
  return (runtimeProps.flags2[runtimeRowIndex(cp)]! & runtimeProps.unifiedIdeographFlag) !== 0;
}

export function isEmojiPresentationCode(cp: number): boolean {
  return (runtimeProps.flags[runtimeRowIndex(cp)]! & runtimeProps.emojiPresentationFlag) !== 0;
}

export function isExtendedPictographicCode(cp: number): boolean {
  return (runtimeProps.flags[runtimeRowIndex(cp)]! & runtimeProps.extendedPictographicFlag) !== 0;
}

export function generalCategoryName(code: number): string {
  return runtimeProps.generalCategoryNames[code] ?? runtimeProps.generalCategoryNames[0]!;
}

export function eastAsianWidthName(code: number): string {
  return runtimeProps.eastAsianWidthNames[code] ?? runtimeProps.eastAsianWidthNames[0]!;
}

export function wordBreakName(code: number): string {
  return runtimeProps.wordBreakNames[code] ?? runtimeProps.wordBreakNames[0]!;
}

export function sentenceBreakName(code: number): string {
  return runtimeProps.sentenceBreakNames[code] ?? runtimeProps.sentenceBreakNames[0]!;
}

export function lineBreakName(code: number): string {
  return runtimeProps.lineBreakNames[code] ?? runtimeProps.lineBreakNames[0]!;
}

export function graphemeBreakName(code: number): string {
  return runtimeProps.graphemeBreakNames[code] ?? runtimeProps.graphemeBreakNames[0]!;
}
