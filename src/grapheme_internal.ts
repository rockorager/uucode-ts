import { get } from "./get.js";

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

function isIndicConjunctBreakExtend(gb: GraphemeBreak): boolean {
  return gb === "indic_conjunct_break_extend" || gb === "zwj";
}

function isExtend(gb: GraphemeBreak): boolean {
  return (
    gb === "zwnj" || gb === "indic_conjunct_break_extend" || gb === "indic_conjunct_break_linker"
  );
}

function isExtendedPictographic(gb: GraphemeBreak): boolean {
  return gb === "extended_pictographic" || gb === "emoji_modifier_base";
}

export function computeGraphemeBreak(
  gb1: GraphemeBreak,
  gb2: GraphemeBreak,
  stateRef: { value: BreakState },
): boolean {
  switch (stateRef.value) {
    case "regional_indicator":
      if (gb1 !== "regional_indicator" || gb2 !== "regional_indicator") stateRef.value = "default";
      break;
    case "extended_pictographic":
      if (
        ![
          "indic_conjunct_break_extend",
          "indic_conjunct_break_linker",
          "zwnj",
          "zwj",
          "extended_pictographic",
          "emoji_modifier_base",
          "emoji_modifier",
        ].includes(gb1) ||
        ![
          "indic_conjunct_break_extend",
          "indic_conjunct_break_linker",
          "zwnj",
          "zwj",
          "extended_pictographic",
          "emoji_modifier_base",
          "emoji_modifier",
        ].includes(gb2)
      ) {
        stateRef.value = "default";
      }
      break;
    case "indic_conjunct_break_consonant":
    case "indic_conjunct_break_linker":
      if (
        ![
          "indic_conjunct_break_consonant",
          "indic_conjunct_break_linker",
          "indic_conjunct_break_extend",
          "zwj",
        ].includes(gb1) ||
        ![
          "indic_conjunct_break_consonant",
          "indic_conjunct_break_linker",
          "indic_conjunct_break_extend",
          "zwj",
        ].includes(gb2)
      ) {
        stateRef.value = "default";
      }
      break;
  }

  if (gb1 === "cr" && gb2 === "lf") return false;
  if (gb1 === "control" || gb1 === "cr" || gb1 === "lf") return true;
  if (gb2 === "control" || gb2 === "cr" || gb2 === "lf") return true;
  if (gb1 === "l" && (gb2 === "l" || gb2 === "v" || gb2 === "lv" || gb2 === "lvt")) return false;
  if ((gb1 === "lv" || gb1 === "v") && (gb2 === "v" || gb2 === "t")) return false;
  if ((gb1 === "lvt" || gb1 === "t") && gb2 === "t") return false;
  if (gb2 === "spacing_mark") return false;
  if (gb1 === "prepend") return false;

  if (gb1 === "indic_conjunct_break_consonant") {
    if (isIndicConjunctBreakExtend(gb2)) {
      stateRef.value = "indic_conjunct_break_consonant";
      return false;
    }
    if (gb2 === "indic_conjunct_break_linker") {
      stateRef.value = "indic_conjunct_break_linker";
      return false;
    }
  } else if (stateRef.value === "indic_conjunct_break_consonant") {
    if (gb2 === "indic_conjunct_break_linker") {
      stateRef.value = "indic_conjunct_break_linker";
      return false;
    }
    if (isIndicConjunctBreakExtend(gb2)) return false;
    stateRef.value = "default";
  } else if (stateRef.value === "indic_conjunct_break_linker") {
    if (gb2 === "indic_conjunct_break_linker" || isIndicConjunctBreakExtend(gb2)) return false;
    if (gb2 === "indic_conjunct_break_consonant") {
      stateRef.value = "default";
      return false;
    }
    stateRef.value = "default";
  }

  if (isExtendedPictographic(gb1)) {
    if (isExtend(gb2) || gb2 === "zwj") {
      stateRef.value = "extended_pictographic";
      return false;
    }
    if (gb1 === "emoji_modifier_base" && gb2 === "emoji_modifier") {
      stateRef.value = "extended_pictographic";
      return false;
    }
  } else if (stateRef.value === "extended_pictographic") {
    if ((isExtend(gb1) || gb1 === "emoji_modifier") && (isExtend(gb2) || gb2 === "zwj"))
      return false;
    if (gb1 === "zwj" && isExtendedPictographic(gb2)) {
      stateRef.value = "default";
      return false;
    }
    stateRef.value = "default";
  }

  if (gb1 === "regional_indicator" && gb2 === "regional_indicator") {
    if (stateRef.value === "default") {
      stateRef.value = "regional_indicator";
      return false;
    }
    stateRef.value = "default";
    return true;
  }

  if (isExtend(gb2) || gb2 === "zwj") return false;
  return true;
}

function toNoControl(gb: GraphemeBreak): GraphemeBreakNoControl {
  return gb === "control" || gb === "cr" || gb === "lf" ? "other" : gb;
}

export function computeGraphemeBreakNoControl(
  gb1: GraphemeBreakNoControl,
  gb2: GraphemeBreakNoControl,
  stateRef: { value: BreakState },
): boolean {
  return computeGraphemeBreak(gb1, gb2, stateRef);
}

export function isBreak(cp1: number, cp2: number, stateRef: { value: BreakState }): boolean {
  return computeGraphemeBreak(
    get("grapheme_break", cp1) as GraphemeBreak,
    get("grapheme_break", cp2) as GraphemeBreak,
    stateRef,
  );
}

export function isBreakNoControl(
  cp1: number,
  cp2: number,
  stateRef: { value: BreakState },
): boolean {
  return computeGraphemeBreakNoControl(
    toNoControl(get("grapheme_break", cp1) as GraphemeBreak),
    toNoControl(get("grapheme_break", cp2) as GraphemeBreak),
    stateRef,
  );
}

type GraphemeBreakField = "grapheme_break" | "grapheme_break_no_control";

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
  private stateValue: BreakState = "default";
  private input: string;
  private nextCp: number | null;
  private nextIndex: number;
  private nextGb: GraphemeBreak;
  private field: GraphemeBreakField;

  constructor(input: string, field: GraphemeBreakField) {
    this.input = input;
    this.indexValue = 0;
    this.stateValue = "default";
    const next = readStringCodePoint(input, 0);
    this.nextCp = next?.codePoint ?? null;
    this.nextIndex = next?.nextIndex ?? 0;
    this.nextGb = this.nextCp === null ? "other" : (get(field, this.nextCp) as GraphemeBreak);
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
      this.nextGb = get(this.field, this.nextCp) as GraphemeBreak;
      let state = this.stateValue;
      const stateRef = {
        get value(): BreakState {
          return state;
        },
        set value(value: BreakState) {
          state = value;
        },
      };
      const isBreakValue = computeGraphemeBreak(gb1, this.nextGb, stateRef);
      this.stateValue = state;
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
