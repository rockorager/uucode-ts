import {
  BREAK_STATE_DEFAULT,
  BREAK_STATE_EXTENDED_PICTOGRAPHIC,
  BREAK_STATE_INDIC_CONJUNCT_CONSONANT,
  BREAK_STATE_INDIC_CONJUNCT_LINKER,
  BREAK_STATE_REGIONAL_INDICATOR,
  GB_CONTROL,
  GB_CR,
  GB_EMOJI_MODIFIER,
  GB_EMOJI_MODIFIER_BASE,
  GB_EXTENDED_PICTOGRAPHIC,
  GB_INDIC_CONJUNCT_CONSONANT,
  GB_INDIC_CONJUNCT_EXTEND,
  GB_INDIC_CONJUNCT_LINKER,
  GB_L,
  GB_LF,
  GB_LV,
  GB_LVT,
  GB_OTHER,
  GB_PREPEND,
  GB_REGIONAL_INDICATOR,
  GB_SPACING_MARK,
  GB_T,
  GB_V,
  GB_ZWJ,
  GB_ZWNJ,
  graphemeBreakCode,
} from "./runtime.js";

export type GraphemeBreak =
  | "other"
  | "control"
  | "prepend"
  | "cr"
  | "lf"
  | "regional_indicator"
  | "spacing_mark"
  | "l"
  | "v"
  | "t"
  | "lv"
  | "lvt"
  | "zwj"
  | "zwnj"
  | "extended_pictographic"
  | "emoji_modifier_base"
  | "emoji_modifier"
  | "indic_conjunct_break_extend"
  | "indic_conjunct_break_linker"
  | "indic_conjunct_break_consonant";

export type GraphemeBreakNoControl = Exclude<GraphemeBreak, "control" | "cr" | "lf">;
export type BreakState =
  | "default"
  | "regional_indicator"
  | "extended_pictographic"
  | "indic_conjunct_break_consonant"
  | "indic_conjunct_break_linker";
export type CodePointBreak = {
  codePoint: number;
  isBreak: boolean;
};
export type GraphemeSegment = { segment: string; start: number; end: number };

function graphemeBreakToCode(gb: GraphemeBreak): number {
  switch (gb) {
    case "control":
      return GB_CONTROL;
    case "prepend":
      return GB_PREPEND;
    case "cr":
      return GB_CR;
    case "lf":
      return GB_LF;
    case "regional_indicator":
      return GB_REGIONAL_INDICATOR;
    case "spacing_mark":
      return GB_SPACING_MARK;
    case "l":
      return GB_L;
    case "v":
      return GB_V;
    case "t":
      return GB_T;
    case "lv":
      return GB_LV;
    case "lvt":
      return GB_LVT;
    case "zwj":
      return GB_ZWJ;
    case "zwnj":
      return GB_ZWNJ;
    case "extended_pictographic":
      return GB_EXTENDED_PICTOGRAPHIC;
    case "emoji_modifier_base":
      return GB_EMOJI_MODIFIER_BASE;
    case "emoji_modifier":
      return GB_EMOJI_MODIFIER;
    case "indic_conjunct_break_extend":
      return GB_INDIC_CONJUNCT_EXTEND;
    case "indic_conjunct_break_linker":
      return GB_INDIC_CONJUNCT_LINKER;
    case "indic_conjunct_break_consonant":
      return GB_INDIC_CONJUNCT_CONSONANT;
    default:
      return GB_OTHER;
  }
}

function breakStateToCode(state: BreakState): number {
  switch (state) {
    case "regional_indicator":
      return BREAK_STATE_REGIONAL_INDICATOR;
    case "extended_pictographic":
      return BREAK_STATE_EXTENDED_PICTOGRAPHIC;
    case "indic_conjunct_break_consonant":
      return BREAK_STATE_INDIC_CONJUNCT_CONSONANT;
    case "indic_conjunct_break_linker":
      return BREAK_STATE_INDIC_CONJUNCT_LINKER;
    default:
      return BREAK_STATE_DEFAULT;
  }
}

function breakStateFromCode(state: number): BreakState {
  switch (state) {
    case BREAK_STATE_REGIONAL_INDICATOR:
      return "regional_indicator";
    case BREAK_STATE_EXTENDED_PICTOGRAPHIC:
      return "extended_pictographic";
    case BREAK_STATE_INDIC_CONJUNCT_CONSONANT:
      return "indic_conjunct_break_consonant";
    case BREAK_STATE_INDIC_CONJUNCT_LINKER:
      return "indic_conjunct_break_linker";
    default:
      return "default";
  }
}

function isIndicConjunctBreakExtendCode(gb: number): boolean {
  return gb === GB_INDIC_CONJUNCT_EXTEND || gb === GB_ZWJ;
}

function isExtendCode(gb: number): boolean {
  return gb === GB_ZWNJ || gb === GB_INDIC_CONJUNCT_EXTEND || gb === GB_INDIC_CONJUNCT_LINKER;
}

function isExtendedPictographicCode(gb: number): boolean {
  return gb === GB_EXTENDED_PICTOGRAPHIC || gb === GB_EMOJI_MODIFIER_BASE;
}

function canContinueExtendedPictographicState(gb: number): boolean {
  return (
    gb === GB_INDIC_CONJUNCT_EXTEND ||
    gb === GB_INDIC_CONJUNCT_LINKER ||
    gb === GB_ZWNJ ||
    gb === GB_ZWJ ||
    gb === GB_EXTENDED_PICTOGRAPHIC ||
    gb === GB_EMOJI_MODIFIER_BASE ||
    gb === GB_EMOJI_MODIFIER
  );
}

function canContinueIndicConjunctState(gb: number): boolean {
  return (
    gb === GB_INDIC_CONJUNCT_CONSONANT ||
    gb === GB_INDIC_CONJUNCT_LINKER ||
    gb === GB_INDIC_CONJUNCT_EXTEND ||
    gb === GB_ZWJ
  );
}

function computeGraphemeBreakCode(gb1: number, gb2: number, stateRef: { value: number }): boolean {
  switch (stateRef.value) {
    case BREAK_STATE_REGIONAL_INDICATOR:
      if (gb1 !== GB_REGIONAL_INDICATOR || gb2 !== GB_REGIONAL_INDICATOR) {
        stateRef.value = BREAK_STATE_DEFAULT;
      }
      break;
    case BREAK_STATE_EXTENDED_PICTOGRAPHIC:
      if (
        !canContinueExtendedPictographicState(gb1) ||
        !canContinueExtendedPictographicState(gb2)
      ) {
        stateRef.value = BREAK_STATE_DEFAULT;
      }
      break;
    case BREAK_STATE_INDIC_CONJUNCT_CONSONANT:
    case BREAK_STATE_INDIC_CONJUNCT_LINKER:
      if (!canContinueIndicConjunctState(gb1) || !canContinueIndicConjunctState(gb2)) {
        stateRef.value = BREAK_STATE_DEFAULT;
      }
      break;
  }

  if (gb1 === GB_CR && gb2 === GB_LF) return false;
  if (gb1 === GB_CONTROL || gb1 === GB_CR || gb1 === GB_LF) return true;
  if (gb2 === GB_CONTROL || gb2 === GB_CR || gb2 === GB_LF) return true;
  if (gb1 === GB_L && (gb2 === GB_L || gb2 === GB_V || gb2 === GB_LV || gb2 === GB_LVT))
    return false;
  if ((gb1 === GB_LV || gb1 === GB_V) && (gb2 === GB_V || gb2 === GB_T)) return false;
  if ((gb1 === GB_LVT || gb1 === GB_T) && gb2 === GB_T) return false;
  if (gb2 === GB_SPACING_MARK) return false;
  if (gb1 === GB_PREPEND) return false;

  if (gb1 === GB_INDIC_CONJUNCT_CONSONANT) {
    if (isIndicConjunctBreakExtendCode(gb2)) {
      stateRef.value = BREAK_STATE_INDIC_CONJUNCT_CONSONANT;
      return false;
    }
    if (gb2 === GB_INDIC_CONJUNCT_LINKER) {
      stateRef.value = BREAK_STATE_INDIC_CONJUNCT_LINKER;
      return false;
    }
  } else if (stateRef.value === BREAK_STATE_INDIC_CONJUNCT_CONSONANT) {
    if (gb2 === GB_INDIC_CONJUNCT_LINKER) {
      stateRef.value = BREAK_STATE_INDIC_CONJUNCT_LINKER;
      return false;
    }
    if (isIndicConjunctBreakExtendCode(gb2)) return false;
    stateRef.value = BREAK_STATE_DEFAULT;
  } else if (stateRef.value === BREAK_STATE_INDIC_CONJUNCT_LINKER) {
    if (gb2 === GB_INDIC_CONJUNCT_LINKER || isIndicConjunctBreakExtendCode(gb2)) return false;
    if (gb2 === GB_INDIC_CONJUNCT_CONSONANT) {
      stateRef.value = BREAK_STATE_DEFAULT;
      return false;
    }
    stateRef.value = BREAK_STATE_DEFAULT;
  }

  if (isExtendedPictographicCode(gb1)) {
    if (isExtendCode(gb2) || gb2 === GB_ZWJ) {
      stateRef.value = BREAK_STATE_EXTENDED_PICTOGRAPHIC;
      return false;
    }
    if (gb1 === GB_EMOJI_MODIFIER_BASE && gb2 === GB_EMOJI_MODIFIER) {
      stateRef.value = BREAK_STATE_EXTENDED_PICTOGRAPHIC;
      return false;
    }
  } else if (stateRef.value === BREAK_STATE_EXTENDED_PICTOGRAPHIC) {
    if ((isExtendCode(gb1) || gb1 === GB_EMOJI_MODIFIER) && (isExtendCode(gb2) || gb2 === GB_ZWJ))
      return false;
    if (gb1 === GB_ZWJ && isExtendedPictographicCode(gb2)) {
      stateRef.value = BREAK_STATE_DEFAULT;
      return false;
    }
    stateRef.value = BREAK_STATE_DEFAULT;
  }

  if (gb1 === GB_REGIONAL_INDICATOR && gb2 === GB_REGIONAL_INDICATOR) {
    if (stateRef.value === BREAK_STATE_DEFAULT) {
      stateRef.value = BREAK_STATE_REGIONAL_INDICATOR;
      return false;
    }
    stateRef.value = BREAK_STATE_DEFAULT;
    return true;
  }

  if (isExtendCode(gb2) || gb2 === GB_ZWJ) return false;
  return true;
}

export function computeGraphemeBreak(
  gb1: GraphemeBreak,
  gb2: GraphemeBreak,
  stateRef: { value: BreakState },
): boolean {
  const state = { value: breakStateToCode(stateRef.value) };
  const isBreakValue = computeGraphemeBreakCode(
    graphemeBreakToCode(gb1),
    graphemeBreakToCode(gb2),
    state,
  );
  stateRef.value = breakStateFromCode(state.value);
  return isBreakValue;
}

function toNoControlCode(gb: number): number {
  return gb === GB_CONTROL || gb === GB_CR || gb === GB_LF ? GB_OTHER : gb;
}

export function computeGraphemeBreakNoControl(
  gb1: GraphemeBreakNoControl,
  gb2: GraphemeBreakNoControl,
  stateRef: { value: BreakState },
): boolean {
  return computeGraphemeBreak(gb1, gb2, stateRef);
}

export function isBreak(cp1: number, cp2: number, stateRef: { value: BreakState }): boolean {
  const state = { value: breakStateToCode(stateRef.value) };
  const isBreakValue = computeGraphemeBreakCode(
    graphemeBreakCode(cp1),
    graphemeBreakCode(cp2),
    state,
  );
  stateRef.value = breakStateFromCode(state.value);
  return isBreakValue;
}

export function isBreakNoControl(
  cp1: number,
  cp2: number,
  stateRef: { value: BreakState },
): boolean {
  const state = { value: breakStateToCode(stateRef.value) };
  const isBreakValue = computeGraphemeBreakCode(
    toNoControlCode(graphemeBreakCode(cp1)),
    toNoControlCode(graphemeBreakCode(cp2)),
    state,
  );
  stateRef.value = breakStateFromCode(state.value);
  return isBreakValue;
}

type GraphemeBreakField = "grapheme_break" | "grapheme_break_no_control";

function lookupGraphemeBreak(field: GraphemeBreakField, cp: number): number {
  const gb = graphemeBreakCode(cp);
  return field === "grapheme_break_no_control" ? toNoControlCode(gb) : gb;
}

function readStringCodePoint(
  input: string,
  index: number,
): { codePoint: number; nextIndex: number } | null {
  if (index >= input.length) return null;
  const codePoint = input.codePointAt(index)!;
  return { codePoint, nextIndex: index + (codePoint > 0xffff ? 2 : 1) };
}

class GraphemeIteratorCore implements IterableIterator<GraphemeSegment> {
  private indexValue = 0;
  private stateValue = BREAK_STATE_DEFAULT;
  private input: string;
  private nextCp: number | null;
  private nextIndex: number;
  private nextGb: number;
  private field: GraphemeBreakField;

  constructor(input: string, field: GraphemeBreakField) {
    this.input = input;
    this.indexValue = 0;
    this.stateValue = BREAK_STATE_DEFAULT;
    const next = readStringCodePoint(input, 0);
    this.nextCp = next?.codePoint ?? null;
    this.nextIndex = next?.nextIndex ?? 0;
    this.nextGb = this.nextCp === null ? GB_OTHER : lookupGraphemeBreak(field, this.nextCp);
    this.field = field;
  }

  get index(): number {
    return this.indexValue;
  }

  clone(): GraphemeIteratorCore {
    const copy = Object.create(GraphemeIteratorCore.prototype) as GraphemeIteratorCore;
    copy.indexValue = this.indexValue;
    copy.stateValue = this.stateValue;
    copy.input = this.input;
    copy.nextCp = this.nextCp;
    copy.nextIndex = this.nextIndex;
    copy.nextGb = this.nextGb;
    copy.field = this.field;
    return copy;
  }

  nextCodePoint(): CodePointBreak | null {
    if (this.nextCp === null) return null;
    const cp1 = this.nextCp;
    const gb1 = this.nextGb;
    this.indexValue = this.nextIndex;
    const next = readStringCodePoint(this.input, this.indexValue);
    this.nextCp = next?.codePoint ?? null;
    this.nextIndex = next?.nextIndex ?? this.indexValue;
    if (this.nextCp !== null) {
      this.nextGb = lookupGraphemeBreak(this.field, this.nextCp);
      const stateRef = { value: this.stateValue };
      const isBreakValue = computeGraphemeBreakCode(gb1, this.nextGb, stateRef);
      this.stateValue = stateRef.value;
      return { codePoint: cp1, isBreak: isBreakValue };
    }
    return { codePoint: cp1, isBreak: true };
  }

  peekCodePoint(): CodePointBreak | null {
    return this.clone().nextCodePoint();
  }

  nextSegment(): GraphemeSegment | null {
    const start = this.indexValue;
    for (;;) {
      const result = this.nextCodePoint();
      if (result === null) return null;
      if (result.isBreak)
        return { segment: this.input.slice(start, this.indexValue), start, end: this.indexValue };
    }
  }

  peekSegment(): GraphemeSegment | null {
    return this.clone().nextSegment();
  }

  next(): IteratorResult<GraphemeSegment> {
    const value = this.nextSegment();
    return value ? { done: false, value } : { done: true, value: undefined };
  }

  [Symbol.iterator](): IterableIterator<GraphemeSegment> {
    return this;
  }
}

export class GraphemeIterator implements IterableIterator<GraphemeSegment> {
  private inner: GraphemeIteratorCore;

  constructor(input: string) {
    this.inner = new GraphemeIteratorCore(input, "grapheme_break");
  }

  private static fromCore(inner: GraphemeIteratorCore): GraphemeIterator {
    const iterator = Object.create(GraphemeIterator.prototype) as GraphemeIterator;
    iterator.inner = inner;
    return iterator;
  }

  static init(input: string): GraphemeIterator {
    return new GraphemeIterator(input);
  }

  get index(): number {
    return this.inner.index;
  }

  clone(): GraphemeIterator {
    return GraphemeIterator.fromCore(this.inner.clone());
  }

  nextCodePoint(): CodePointBreak | null {
    return this.inner.nextCodePoint();
  }

  peekCodePoint(): CodePointBreak | null {
    return this.inner.peekCodePoint();
  }

  nextSegment(): GraphemeSegment | null {
    return this.inner.nextSegment();
  }

  peekSegment(): GraphemeSegment | null {
    return this.inner.peekSegment();
  }

  next(): IteratorResult<GraphemeSegment> {
    return this.inner.next();
  }

  [Symbol.iterator](): IterableIterator<GraphemeSegment> {
    return this;
  }
}

export class GraphemeIteratorNoControl implements IterableIterator<GraphemeSegment> {
  private inner: GraphemeIteratorCore;

  constructor(input: string) {
    this.inner = new GraphemeIteratorCore(input, "grapheme_break_no_control");
  }

  private static fromCore(inner: GraphemeIteratorCore): GraphemeIteratorNoControl {
    const iterator = Object.create(
      GraphemeIteratorNoControl.prototype,
    ) as GraphemeIteratorNoControl;
    iterator.inner = inner;
    return iterator;
  }

  static init(input: string): GraphemeIteratorNoControl {
    return new GraphemeIteratorNoControl(input);
  }

  get index(): number {
    return this.inner.index;
  }

  clone(): GraphemeIteratorNoControl {
    return GraphemeIteratorNoControl.fromCore(this.inner.clone());
  }

  nextCodePoint(): CodePointBreak | null {
    return this.inner.nextCodePoint();
  }

  peekCodePoint(): CodePointBreak | null {
    return this.inner.peekCodePoint();
  }

  nextSegment(): GraphemeSegment | null {
    return this.inner.nextSegment();
  }

  peekSegment(): GraphemeSegment | null {
    return this.inner.peekSegment();
  }

  next(): IteratorResult<GraphemeSegment> {
    return this.inner.next();
  }

  [Symbol.iterator](): IterableIterator<GraphemeSegment> {
    return this;
  }
}

export function graphemes(input: string): GraphemeIterator {
  return new GraphemeIterator(input);
}

export function graphemesNoControl(input: string): GraphemeIteratorNoControl {
  return new GraphemeIteratorNoControl(input);
}
