import {
  EAW_FULLWIDTH,
  EAW_HALFWIDTH,
  EAW_NARROW,
  EAW_WIDE,
  GC_LETTER_UPPERCASE,
  GC_MARK_NONSPACING,
  GC_MARK_SPACING_COMBINING,
  GC_OTHER_NOT_ASSIGNED,
  GC_PUNCTUATION_FINAL_QUOTE,
  GC_PUNCTUATION_INITIAL_QUOTE,
  LB_AI,
  LB_AK,
  LB_AL,
  LB_AP,
  LB_AS,
  LB_B2,
  LB_BA,
  LB_BB,
  LB_BK,
  LB_CB,
  LB_CJ,
  LB_CL,
  LB_CM,
  LB_CP,
  LB_CR,
  LB_EB,
  LB_EM,
  LB_EX,
  LB_GL,
  LB_H2,
  LB_H3,
  LB_HH,
  LB_HL,
  LB_HY,
  LB_ID,
  LB_IN,
  LB_IS,
  LB_JL,
  LB_JT,
  LB_JV,
  LB_LF,
  LB_NL,
  LB_NS,
  LB_NU,
  LB_OP,
  LB_PO,
  LB_PR,
  LB_QU,
  LB_RI,
  LB_SA,
  LB_SG,
  LB_SP,
  LB_SY,
  LB_VF,
  LB_VI,
  LB_WJ,
  LB_XX,
  LB_ZW,
  LB_ZWJ,
  eastAsianWidthCode,
  generalCategoryCode,
  isExtendedPictographicCode,
  lineBreakCode,
} from "./runtime.js";

export type LineBreakKind = "dont_break" | "can_break" | "must_break";
export type LineSegment = { start: number; end: number; break: LineBreakKind };

const LINE_DONT_BREAK: LineBreakKind = "dont_break";
const LINE_CAN_BREAK: LineBreakKind = "can_break";
const LINE_MUST_BREAK: LineBreakKind = "must_break";

const LINE_NUM_NONE = 0;
const LINE_NUM_SEQ = 1;
const LINE_NUM_CLOSE = 2;

type LineItem = {
  start: number;
  end: number;
  lb: number;
  gc: number;
  eaw: number;
  zwj: boolean;
  cm: boolean;
  dotted: boolean;
  extPicCn: boolean;
};

class LineState {
  havePrev = false;
  prev = emptyLineItem();
  prev2 = emptyLineItem();
  havePrev2 = false;
  haveBeforeSpaces = false;
  beforeSpaces = emptyLineItem();
  prevInitialQuote = false;
  beforeSpacesInitialQuote = false;
  afterZWJ = false;
  riRun = 0;
  numState = LINE_NUM_NONE;

  boundaryBefore(cur: LineItem, input: string): LineBreakKind {
    if (!this.havePrev) return LINE_DONT_BREAK;
    const prev = this.prev;

    if (prev.lb === LB_BK) return LINE_MUST_BREAK;
    if (prev.lb === LB_CR) return cur.lb === LB_LF ? LINE_DONT_BREAK : LINE_MUST_BREAK;
    if (prev.lb === LB_LF || prev.lb === LB_NL) return LINE_MUST_BREAK;

    if (isLineHardBreak(cur.lb)) return LINE_DONT_BREAK;
    if (cur.lb === LB_SP || cur.lb === LB_ZW) return LINE_DONT_BREAK;

    if (
      prev.lb === LB_ZW ||
      (prev.lb === LB_SP && this.haveBeforeSpaces && this.beforeSpaces.lb === LB_ZW)
    ) {
      return LINE_CAN_BREAK;
    }

    if (this.afterZWJ) return LINE_DONT_BREAK;

    if ((cur.cm || cur.zwj) && canAttachLineMark(prev.lb)) return LINE_DONT_BREAK;
    if (cur.cm || cur.zwj) cur = asAL(cur);

    if (cur.lb === LB_WJ || prev.lb === LB_WJ) return LINE_DONT_BREAK;
    if (prev.lb === LB_GL) return LINE_DONT_BREAK;

    if (
      cur.lb === LB_GL &&
      prev.lb !== LB_SP &&
      prev.lb !== LB_BA &&
      prev.lb !== LB_HY &&
      prev.lb !== LB_HH
    ) {
      return LINE_DONT_BREAK;
    }

    if (cur.lb === LB_CL || cur.lb === LB_CP || cur.lb === LB_EX || cur.lb === LB_SY) {
      return LINE_DONT_BREAK;
    }

    if (
      prev.lb === LB_OP ||
      (prev.lb === LB_SP && this.haveBeforeSpaces && this.beforeSpaces.lb === LB_OP)
    ) {
      return LINE_DONT_BREAK;
    }

    if (this.prevInitialQuote || (prev.lb === LB_SP && this.beforeSpacesInitialQuote)) {
      return LINE_DONT_BREAK;
    }

    if (isLineFinalQuote(cur)) {
      const next = firstLineItem(input, cur.end);
      if (!next || isLineAfterFinalQuote(next.lb)) return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_SP && cur.lb === LB_IS) {
      const next = firstLineItem(input, cur.end);
      if (next && next.lb === LB_NU) return LINE_CAN_BREAK;
    }

    if (cur.lb === LB_IS) return LINE_DONT_BREAK;

    if (
      cur.lb === LB_NS &&
      (prev.lb === LB_CL ||
        prev.lb === LB_CP ||
        (prev.lb === LB_SP &&
          this.haveBeforeSpaces &&
          (this.beforeSpaces.lb === LB_CL || this.beforeSpaces.lb === LB_CP)))
    ) {
      return LINE_DONT_BREAK;
    }

    if (
      cur.lb === LB_B2 &&
      (prev.lb === LB_B2 ||
        (prev.lb === LB_SP && this.haveBeforeSpaces && this.beforeSpaces.lb === LB_B2))
    ) {
      return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_SP) return LINE_CAN_BREAK;

    if (cur.lb === LB_QU && !isLineInitialQuote(cur)) return LINE_DONT_BREAK;
    if (prev.lb === LB_QU && !isLineFinalQuote(prev)) return LINE_DONT_BREAK;

    if (cur.lb === LB_QU && !isLineEastAsian(prev)) return LINE_DONT_BREAK;
    if (cur.lb === LB_QU) {
      const next = firstLineItem(input, cur.end);
      if (!next || !isLineEastAsian(next)) return LINE_DONT_BREAK;
    }
    if (prev.lb === LB_QU && !isLineEastAsian(cur)) return LINE_DONT_BREAK;
    if (prev.lb === LB_QU && (!this.havePrev2 || !isLineEastAsian(this.prev2))) {
      return LINE_DONT_BREAK;
    }

    if (cur.lb === LB_CB || prev.lb === LB_CB) return LINE_CAN_BREAK;

    if (
      (cur.lb === LB_AL || cur.lb === LB_HL) &&
      (prev.lb === LB_HY || prev.lb === LB_HH) &&
      (!this.havePrev2 || isLineWordInitialHyphenBefore(this.prev2.lb))
    ) {
      return LINE_DONT_BREAK;
    }

    if (
      cur.lb === LB_BA ||
      cur.lb === LB_HH ||
      cur.lb === LB_HY ||
      cur.lb === LB_NS ||
      prev.lb === LB_BB
    ) {
      return LINE_DONT_BREAK;
    }

    if (
      cur.lb !== LB_HL &&
      (prev.lb === LB_HY || prev.lb === LB_HH) &&
      this.havePrev2 &&
      this.prev2.lb === LB_HL
    ) {
      return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_SY && cur.lb === LB_HL) return LINE_DONT_BREAK;
    if (cur.lb === LB_IN) return LINE_DONT_BREAK;

    if ((prev.lb === LB_AL || prev.lb === LB_HL) && cur.lb === LB_NU) return LINE_DONT_BREAK;
    if (prev.lb === LB_NU && (cur.lb === LB_AL || cur.lb === LB_HL)) return LINE_DONT_BREAK;

    if (prev.lb === LB_PR && (cur.lb === LB_ID || cur.lb === LB_EB || cur.lb === LB_EM)) {
      return LINE_DONT_BREAK;
    }
    if ((prev.lb === LB_ID || prev.lb === LB_EB || prev.lb === LB_EM) && cur.lb === LB_PO) {
      return LINE_DONT_BREAK;
    }

    if ((prev.lb === LB_PR || prev.lb === LB_PO) && (cur.lb === LB_AL || cur.lb === LB_HL)) {
      return LINE_DONT_BREAK;
    }
    if ((prev.lb === LB_AL || prev.lb === LB_HL) && (cur.lb === LB_PR || cur.lb === LB_PO)) {
      return LINE_DONT_BREAK;
    }

    if (this.matchesLineNumericNoBreakBefore(cur, input)) return LINE_DONT_BREAK;

    if (
      prev.lb === LB_JL &&
      (cur.lb === LB_JL || cur.lb === LB_JV || cur.lb === LB_H2 || cur.lb === LB_H3)
    ) {
      return LINE_DONT_BREAK;
    }
    if ((prev.lb === LB_JV || prev.lb === LB_H2) && (cur.lb === LB_JV || cur.lb === LB_JT)) {
      return LINE_DONT_BREAK;
    }
    if ((prev.lb === LB_JT || prev.lb === LB_H3) && cur.lb === LB_JT) return LINE_DONT_BREAK;

    if (isLineHangulSyllable(prev.lb) && cur.lb === LB_PO) return LINE_DONT_BREAK;
    if (prev.lb === LB_PR && isLineHangulSyllable(cur.lb)) return LINE_DONT_BREAK;

    if ((prev.lb === LB_AL || prev.lb === LB_HL) && (cur.lb === LB_AL || cur.lb === LB_HL)) {
      return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_AP && isLineAksaraStart(cur)) return LINE_DONT_BREAK;
    if (isLineAksaraStart(prev) && (cur.lb === LB_VF || cur.lb === LB_VI)) return LINE_DONT_BREAK;
    if (
      prev.lb === LB_VI &&
      this.havePrev2 &&
      isLineAksaraStart(this.prev2) &&
      isLineAksaraCore(cur)
    ) {
      return LINE_DONT_BREAK;
    }
    if (isLineAksaraStart(prev) && isLineAksaraStart(cur)) {
      const next = firstLineItem(input, cur.end);
      if (next && next.lb === LB_VF) return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_IS && (cur.lb === LB_AL || cur.lb === LB_HL)) return LINE_DONT_BREAK;

    if (
      (prev.lb === LB_AL || prev.lb === LB_HL || prev.lb === LB_NU) &&
      cur.lb === LB_OP &&
      !isLineEastAsian(cur)
    ) {
      return LINE_DONT_BREAK;
    }
    if (
      prev.lb === LB_CP &&
      !isLineEastAsian(prev) &&
      (cur.lb === LB_AL || cur.lb === LB_HL || cur.lb === LB_NU)
    ) {
      return LINE_DONT_BREAK;
    }

    if (prev.lb === LB_RI && cur.lb === LB_RI && this.riRun % 2 === 1) {
      return LINE_DONT_BREAK;
    }

    if ((prev.lb === LB_EB || prev.extPicCn) && cur.lb === LB_EM) return LINE_DONT_BREAK;

    return LINE_CAN_BREAK;
  }

  consume(item: LineItem, noBreak: boolean): void {
    let ignore = false;
    if (this.havePrev && (item.cm || item.zwj) && canAttachLineMark(this.prev.lb)) {
      ignore = noBreak;
    }
    if (item.cm || item.zwj) {
      if (!ignore) item = asAL(item);
    }

    this.afterZWJ = item.zwj;
    if (ignore) return;

    const initialQuote = isLineInitialQuote(item) && this.initialQuoteContext();

    if (this.havePrev) {
      this.prev2 = this.prev;
      this.havePrev2 = true;
    }
    this.prev = item;
    this.havePrev = true;

    if (item.lb === LB_SP) {
      if (this.prev2.lb !== LB_SP) {
        this.beforeSpaces = this.prev2;
        this.haveBeforeSpaces = this.havePrev2;
        this.beforeSpacesInitialQuote = this.prevInitialQuote;
      }
    } else {
      this.haveBeforeSpaces = false;
      this.beforeSpacesInitialQuote = false;
    }

    this.prevInitialQuote = initialQuote;
    this.updateLineNumericState(item.lb);
    if (item.lb === LB_RI) this.riRun += 1;
    else this.riRun = 0;
  }

  initialQuoteContext(): boolean {
    if (!this.havePrev) return true;
    switch (this.prev.lb) {
      case LB_BK:
      case LB_CR:
      case LB_LF:
      case LB_NL:
      case LB_OP:
      case LB_QU:
      case LB_GL:
      case LB_SP:
      case LB_ZW:
        return true;
      default:
        return false;
    }
  }

  updateLineNumericState(lb: number): void {
    switch (lb) {
      case LB_NU:
        this.numState = LINE_NUM_SEQ;
        break;
      case LB_SY:
      case LB_IS:
        if (this.numState !== LINE_NUM_SEQ) this.numState = LINE_NUM_NONE;
        break;
      case LB_CL:
      case LB_CP:
        this.numState = this.numState === LINE_NUM_SEQ ? LINE_NUM_CLOSE : LINE_NUM_NONE;
        break;
      default:
        this.numState = LINE_NUM_NONE;
        break;
    }
  }

  matchesLineNumericNoBreakBefore(cur: LineItem, input: string): boolean {
    const prev = this.prev;
    if (
      (cur.lb === LB_PO || cur.lb === LB_PR) &&
      (this.numState === LINE_NUM_SEQ || this.numState === LINE_NUM_CLOSE)
    ) {
      return true;
    }
    if ((prev.lb === LB_PO || prev.lb === LB_PR) && cur.lb === LB_OP) {
      return restStartsLineNumber(input, cur.end);
    }
    if ((prev.lb === LB_PO || prev.lb === LB_PR) && cur.lb === LB_NU) return true;
    if (prev.lb === LB_HY && cur.lb === LB_NU) return true;
    if (prev.lb === LB_IS && cur.lb === LB_NU) return true;
    return this.numState === LINE_NUM_SEQ && cur.lb === LB_NU;
  }
}

export class LineIterator implements IterableIterator<LineSegment> {
  private input: string;
  private segStart = 0;
  private nextIndex = 0;
  private lastEnd = 0;
  private done = false;
  private state = new LineState();

  constructor(input: string) {
    this.input = input;
    const item = nextLineItem(input, 0);
    if (!item) {
      this.done = true;
      return;
    }
    this.state.consume(item, true);
    this.nextIndex = item.end;
    this.lastEnd = item.end;
  }

  static init(input: string): LineIterator {
    return new LineIterator(input);
  }

  nextSegment(): LineSegment | null {
    if (this.done || !this.state.havePrev) return null;
    for (;;) {
      if (this.nextIndex >= this.input.length) {
        this.done = true;
        return { start: this.segStart, end: this.lastEnd, break: LINE_MUST_BREAK };
      }

      const item = nextLineItem(this.input, this.nextIndex);
      if (!item) {
        this.done = true;
        return { start: this.segStart, end: this.lastEnd, break: LINE_MUST_BREAK };
      }

      const kind = this.state.boundaryBefore(item, this.input);
      this.state.consume(item, kind === LINE_DONT_BREAK);
      this.nextIndex = item.end;
      this.lastEnd = item.end;
      if (kind !== LINE_DONT_BREAK) {
        const segment = { start: this.segStart, end: item.start, break: kind };
        this.segStart = item.start;
        return segment;
      }
    }
  }

  peekSegment(): LineSegment | null {
    return this.clone().nextSegment();
  }

  clone(): LineIterator {
    const copy = Object.create(LineIterator.prototype) as LineIterator;
    copy.input = this.input;
    copy.segStart = this.segStart;
    copy.nextIndex = this.nextIndex;
    copy.lastEnd = this.lastEnd;
    copy.done = this.done;
    copy.state = cloneLineState(this.state);
    return copy;
  }

  next(): IteratorResult<LineSegment> {
    const value = this.nextSegment();
    return value ? { done: false, value } : { done: true, value: undefined };
  }

  [Symbol.iterator](): IterableIterator<LineSegment> {
    return this;
  }
}

export function lineSegments(input: string): LineIterator {
  return new LineIterator(input);
}

function cloneLineState(state: LineState): LineState {
  const copy = new LineState();
  copy.havePrev = state.havePrev;
  copy.prev = state.prev;
  copy.prev2 = state.prev2;
  copy.havePrev2 = state.havePrev2;
  copy.haveBeforeSpaces = state.haveBeforeSpaces;
  copy.beforeSpaces = state.beforeSpaces;
  copy.prevInitialQuote = state.prevInitialQuote;
  copy.beforeSpacesInitialQuote = state.beforeSpacesInitialQuote;
  copy.afterZWJ = state.afterZWJ;
  copy.riRun = state.riRun;
  copy.numState = state.numState;
  return copy;
}

function nextLineItem(input: string, index: number): LineItem | null {
  if (index >= input.length) return null;
  const cp = input.codePointAt(index);
  if (cp === undefined) return null;
  const end = index + (cp > 0xffff ? 2 : 1);
  let lb = lineBreakCode(cp);
  let gc = generalCategoryCode(cp);

  switch (lb) {
    case LB_AI:
    case LB_SG:
    case LB_XX:
      lb = LB_AL;
      break;
    case LB_SA:
      lb = gc === GC_MARK_NONSPACING || gc === GC_MARK_SPACING_COMBINING ? LB_CM : LB_AL;
      break;
    case LB_CJ:
      lb = LB_NS;
      break;
  }

  return {
    start: index,
    end,
    lb,
    gc,
    eaw: eastAsianWidthCode(cp),
    zwj: lb === LB_ZWJ,
    cm: lb === LB_CM,
    dotted: cp === 0x25cc,
    extPicCn: isExtendedPictographicCode(cp) && gc === GC_OTHER_NOT_ASSIGNED,
  };
}

function firstLineItem(input: string, index: number): LineItem | null {
  return nextLineItem(input, index);
}

function emptyLineItem(): LineItem {
  return {
    start: 0,
    end: 0,
    lb: LB_AL,
    gc: GC_LETTER_UPPERCASE,
    eaw: EAW_NARROW,
    zwj: false,
    cm: false,
    dotted: false,
    extPicCn: false,
  };
}

function asAL(item: LineItem): LineItem {
  return {
    ...item,
    lb: LB_AL,
    gc: GC_LETTER_UPPERCASE,
    eaw: EAW_NARROW,
    cm: false,
    extPicCn: false,
  };
}

function restStartsLineNumber(input: string, index: number): boolean {
  const item = firstLineItem(input, index);
  if (!item) return false;
  if (item.lb === LB_NU) return true;
  if (item.lb === LB_IS) {
    const next = firstLineItem(input, item.end);
    return !!next && next.lb === LB_NU;
  }
  return false;
}

function isLineHardBreak(lb: number): boolean {
  return lb === LB_BK || lb === LB_CR || lb === LB_LF || lb === LB_NL;
}

function canAttachLineMark(lb: number): boolean {
  return (
    lb !== LB_BK && lb !== LB_CR && lb !== LB_LF && lb !== LB_NL && lb !== LB_SP && lb !== LB_ZW
  );
}

function isLineInitialQuote(item: LineItem): boolean {
  return item.lb === LB_QU && item.gc === GC_PUNCTUATION_INITIAL_QUOTE;
}

function isLineFinalQuote(item: LineItem): boolean {
  return item.lb === LB_QU && item.gc === GC_PUNCTUATION_FINAL_QUOTE;
}

function isLineAfterFinalQuote(lb: number): boolean {
  switch (lb) {
    case LB_SP:
    case LB_GL:
    case LB_WJ:
    case LB_CL:
    case LB_QU:
    case LB_CP:
    case LB_EX:
    case LB_IS:
    case LB_SY:
    case LB_BK:
    case LB_CR:
    case LB_LF:
    case LB_NL:
    case LB_ZW:
      return true;
    default:
      return false;
  }
}

function isLineEastAsian(item: LineItem): boolean {
  return item.eaw === EAW_FULLWIDTH || item.eaw === EAW_WIDE || item.eaw === EAW_HALFWIDTH;
}

function isLineWordInitialHyphenBefore(lb: number): boolean {
  switch (lb) {
    case LB_BK:
    case LB_CR:
    case LB_LF:
    case LB_NL:
    case LB_SP:
    case LB_ZW:
    case LB_CB:
    case LB_GL:
      return true;
    default:
      return false;
  }
}

function isLineHangulSyllable(lb: number): boolean {
  return lb === LB_JL || lb === LB_JV || lb === LB_JT || lb === LB_H2 || lb === LB_H3;
}

function isLineAksaraStart(item: LineItem): boolean {
  return item.lb === LB_AK || item.lb === LB_AS || item.dotted;
}

function isLineAksaraCore(item: LineItem): boolean {
  return item.lb === LB_AK || item.dotted;
}
