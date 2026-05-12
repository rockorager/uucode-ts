import { runtimeWidth } from "./generated/runtime_width.js";

const STAGE1 = runtimeWidth.stage1;
const STAGE2 = runtimeWidth.stage2;
const STAGE3 = runtimeWidth.stage3;
const STAGE1_SHIFT = runtimeWidth.stage1Shift;
const STAGE2_MASK = runtimeWidth.stage2Mask;
const WIDTH_MASK = runtimeWidth.widthMask;
const ZERO_WIDTH_FLAG = runtimeWidth.zeroWidthFlag;
const EMOJI_VS_FLAG = runtimeWidth.emojiVSFlag;
const DEFAULT_ROW = 1 << 5;

const GB_CONTROL = 1;
const GB_PREPEND = 2;
const GB_CR = 3;
const GB_LF = 4;
const GB_REGIONAL_INDICATOR = 5;
const GB_SPACING_MARK = 6;
const GB_L = 7;
const GB_V = 8;
const GB_T = 9;
const GB_LV = 10;
const GB_LVT = 11;
const GB_ZWJ = 12;
const GB_ZWNJ = 13;
const GB_EXTENDED_PICTOGRAPHIC = 14;
const GB_EMOJI_MODIFIER_BASE = 15;
const GB_EMOJI_MODIFIER = 16;
const GB_INDIC_CONJUNCT_EXTEND = 17;
const GB_INDIC_CONJUNCT_LINKER = 18;
const GB_INDIC_CONJUNCT_CONSONANT = 19;

const BREAK_STATE_DEFAULT = 0;
const BREAK_STATE_REGIONAL_INDICATOR = 1;
const BREAK_STATE_EXTENDED_PICTOGRAPHIC = 2;
const BREAK_STATE_INDIC_CONJUNCT_CONSONANT = 3;
const BREAK_STATE_INDIC_CONJUNCT_LINKER = 4;

function runtimeLookup(cp: number): number {
  if (!Number.isInteger(cp) || cp < 0 || cp > runtimeWidth.maxCodePoint) return DEFAULT_ROW;
  return runtimeLookupValid(cp);
}

function runtimeLookupValid(cp: number): number {
  const stage2Offset = STAGE1[cp >> STAGE1_SHIFT]!;
  const rowIndex = STAGE2[stage2Offset + (cp & STAGE2_MASK)]!;
  return STAGE3[rowIndex]!;
}

function rowGB(row: number): number {
  return row & 0x1f;
}

export function codePointWidth(cp: number): number {
  return (runtimeLookup(cp) >> 5) & WIDTH_MASK;
}

function rowWidth(row: number): number {
  return (row >> 5) & WIDTH_MASK;
}

function rowZeroInGrapheme(row: number): boolean {
  return ((row >> 5) & ZERO_WIDTH_FLAG) !== 0;
}

function rowIsEmojiVSBase(row: number): boolean {
  return ((row >> 8) & EMOJI_VS_FLAG) !== 0;
}

function isIndicConjunctBreakExtend(gb: number): boolean {
  return gb === GB_INDIC_CONJUNCT_EXTEND || gb === GB_ZWJ;
}

function isExtend(gb: number): boolean {
  return gb === GB_ZWNJ || gb === GB_INDIC_CONJUNCT_EXTEND || gb === GB_INDIC_CONJUNCT_LINKER;
}

function isExtendedPictographic(gb: number): boolean {
  return gb === GB_EXTENDED_PICTOGRAPHIC || gb === GB_EMOJI_MODIFIER_BASE;
}

function possiblyEmojiSequencePart(gb: number): boolean {
  return (
    isExtend(gb) ||
    gb === GB_ZWJ ||
    gb === GB_EXTENDED_PICTOGRAPHIC ||
    gb === GB_EMOJI_MODIFIER_BASE ||
    gb === GB_EMOJI_MODIFIER
  );
}

function possiblyIndicSequencePart(gb: number): boolean {
  return (
    gb === GB_INDIC_CONJUNCT_CONSONANT ||
    gb === GB_INDIC_CONJUNCT_LINKER ||
    gb === GB_INDIC_CONJUNCT_EXTEND ||
    gb === GB_ZWJ
  );
}

function computeGraphemeBreakPacked(gb1: number, gb2: number, state: number): number {
  switch (state) {
    case BREAK_STATE_REGIONAL_INDICATOR:
      if (gb1 !== GB_REGIONAL_INDICATOR || gb2 !== GB_REGIONAL_INDICATOR)
        state = BREAK_STATE_DEFAULT;
      break;
    case BREAK_STATE_EXTENDED_PICTOGRAPHIC:
      if (!possiblyEmojiSequencePart(gb1) || !possiblyEmojiSequencePart(gb2))
        state = BREAK_STATE_DEFAULT;
      break;
    case BREAK_STATE_INDIC_CONJUNCT_CONSONANT:
    case BREAK_STATE_INDIC_CONJUNCT_LINKER:
      if (!possiblyIndicSequencePart(gb1) || !possiblyIndicSequencePart(gb2))
        state = BREAK_STATE_DEFAULT;
      break;
  }

  if (gb1 === GB_CR && gb2 === GB_LF) return state << 1;
  if (gb1 === GB_CONTROL || gb1 === GB_CR || gb1 === GB_LF) return (state << 1) | 1;
  if (gb2 === GB_CONTROL || gb2 === GB_CR || gb2 === GB_LF) return (state << 1) | 1;
  if (gb1 === GB_L && (gb2 === GB_L || gb2 === GB_V || gb2 === GB_LV || gb2 === GB_LVT))
    return state << 1;
  if ((gb1 === GB_LV || gb1 === GB_V) && (gb2 === GB_V || gb2 === GB_T)) return state << 1;
  if ((gb1 === GB_LVT || gb1 === GB_T) && gb2 === GB_T) return state << 1;
  if (gb2 === GB_SPACING_MARK) return state << 1;
  if (gb1 === GB_PREPEND) return state << 1;

  if (gb1 === GB_INDIC_CONJUNCT_CONSONANT) {
    if (isIndicConjunctBreakExtend(gb2)) {
      return BREAK_STATE_INDIC_CONJUNCT_CONSONANT << 1;
    }
    if (gb2 === GB_INDIC_CONJUNCT_LINKER) {
      return BREAK_STATE_INDIC_CONJUNCT_LINKER << 1;
    }
  } else if (state === BREAK_STATE_INDIC_CONJUNCT_CONSONANT) {
    if (gb2 === GB_INDIC_CONJUNCT_LINKER) {
      return BREAK_STATE_INDIC_CONJUNCT_LINKER << 1;
    }
    if (isIndicConjunctBreakExtend(gb2)) return state << 1;
    state = BREAK_STATE_DEFAULT;
  } else if (state === BREAK_STATE_INDIC_CONJUNCT_LINKER) {
    if (gb2 === GB_INDIC_CONJUNCT_LINKER || isIndicConjunctBreakExtend(gb2)) return state << 1;
    if (gb2 === GB_INDIC_CONJUNCT_CONSONANT) {
      return BREAK_STATE_DEFAULT << 1;
    }
    state = BREAK_STATE_DEFAULT;
  }

  if (isExtendedPictographic(gb1)) {
    if (isExtend(gb2) || gb2 === GB_ZWJ) {
      return BREAK_STATE_EXTENDED_PICTOGRAPHIC << 1;
    }
    if (gb1 === GB_EMOJI_MODIFIER_BASE && gb2 === GB_EMOJI_MODIFIER) {
      return BREAK_STATE_EXTENDED_PICTOGRAPHIC << 1;
    }
  } else if (state === BREAK_STATE_EXTENDED_PICTOGRAPHIC) {
    if ((isExtend(gb1) || gb1 === GB_EMOJI_MODIFIER) && (isExtend(gb2) || gb2 === GB_ZWJ))
      return state << 1;
    if (gb1 === GB_ZWJ && isExtendedPictographic(gb2)) {
      return BREAK_STATE_DEFAULT << 1;
    }
    state = BREAK_STATE_DEFAULT;
  }

  if (gb1 === GB_REGIONAL_INDICATOR && gb2 === GB_REGIONAL_INDICATOR) {
    if (state === BREAK_STATE_DEFAULT) {
      return BREAK_STATE_REGIONAL_INDICATOR << 1;
    }
    return (BREAK_STATE_DEFAULT << 1) | 1;
  }
  if (isExtend(gb2) || gb2 === GB_ZWJ) return state << 1;
  return (state << 1) | 1;
}

type WidthIterator = {
  state: number;
  nextIndex: number;
  nextCP: number;
  nextRow: number;
  hasNext: boolean;
  cp: number;
  row: number;
  isBreak: boolean;
  s: string;
};

function newWidthIterator(s: string, start: number): WidthIterator {
  const hasFirst = start < s.length;
  const firstCP = hasFirst ? s.codePointAt(start)! : 0;
  const firstNextIndex = hasFirst ? start + (firstCP > 0xffff ? 2 : 1) : start;
  const row = hasFirst ? runtimeLookupValid(firstCP) : DEFAULT_ROW;
  return {
    state: BREAK_STATE_DEFAULT,
    nextIndex: firstNextIndex,
    nextCP: firstCP,
    nextRow: row,
    hasNext: hasFirst,
    cp: 0,
    row: DEFAULT_ROW,
    isBreak: false,
    s,
  };
}

function advance(it: WidthIterator): boolean {
  if (!it.hasNext) return false;
  it.cp = it.nextCP;
  it.row = it.nextRow;

  const index = it.nextIndex;
  if (index >= it.s.length) {
    it.hasNext = false;
    it.isBreak = true;
    return true;
  }

  const first = it.s.charCodeAt(index);
  let cp = first;
  let nextIndex = index + 1;
  if (first >= 0xd800 && first <= 0xdbff && nextIndex < it.s.length) {
    const second = it.s.charCodeAt(nextIndex);
    if (second >= 0xdc00 && second <= 0xdfff) {
      cp = ((first - 0xd800) << 10) + second - 0xdc00 + 0x10000;
      nextIndex += 1;
    }
  }

  const row = runtimeLookupValid(cp);
  const packed = computeGraphemeBreakPacked(rowGB(it.row), rowGB(row), it.state);
  it.state = packed >> 1;
  it.nextCP = cp;
  it.nextIndex = nextIndex;
  it.nextRow = row;
  it.isBreak = (packed & 1) !== 0;
  return true;
}

function widthNext(it: WidthIterator): number {
  if (!advance(it)) return 0;
  const standalone = rowWidth(it.row);
  if (it.isBreak) return standalone;

  let width = rowZeroInGrapheme(it.row) ? 0 : standalone;
  let prevRow = it.row;
  let prevState = it.state;

  for (;;) {
    if (!advance(it)) break;
    switch (it.cp) {
      case 0xfe0f:
        if (rowIsEmojiVSBase(prevRow)) width = 2;
        break;
      case 0xfe0e:
        if (rowIsEmojiVSBase(prevRow)) width = 1;
        break;
      case 0x200d:
        if (prevState === BREAK_STATE_EXTENDED_PICTOGRAPHIC && !it.isBreak) {
          if (!advance(it) || it.isBreak) return width;
          prevRow = it.row;
          prevState = it.state;
          continue;
        }
        break;
      case 0x1f3fb:
      case 0x1f3fc:
      case 0x1f3fd:
      case 0x1f3fe:
      case 0x1f3ff:
        width = 2;
        break;
      default:
        if (prevState === BREAK_STATE_REGIONAL_INDICATOR) width = 2;
        else if (!rowZeroInGrapheme(it.row)) width += rowWidth(it.row);
        break;
    }
    if (it.isBreak) break;
    prevRow = it.row;
    prevState = it.state;
  }
  return width;
}

export function stringWidth(s: string): number {
  let width = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c >= 0x80) {
      if (i === 0) return stringWidthFrom(s, 0);
      const previous = s.charCodeAt(i - 1);
      return width - (previous >= 0x20 && previous !== 0x7f ? 1 : 0) + stringWidthFrom(s, i - 1);
    }
    if (c >= 0x20 && c !== 0x7f) width += 1;
  }
  return width;
}

function stringWidthFrom(s: string, start: number): number {
  const it = newWidthIterator(s, start);
  let width = 0;
  while (it.hasNext) width += widthNext(it);
  return width;
}
