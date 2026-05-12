import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const UCD = join(root, "ucd");
const MAX = 0x10ffff;
const COUNT = MAX + 1;

type Range<T> = [start: number, end: number, value: T];
type Sparse<T> = [codePoint: number, value: T];

const gcMap: Record<string, string> = {
  Lu: "letter_uppercase",
  Ll: "letter_lowercase",
  Lt: "letter_titlecase",
  Lm: "letter_modifier",
  Lo: "letter_other",
  Mn: "mark_nonspacing",
  Mc: "mark_spacing_combining",
  Me: "mark_enclosing",
  Nd: "number_decimal_digit",
  Nl: "number_letter",
  No: "number_other",
  Pc: "punctuation_connector",
  Pd: "punctuation_dash",
  Ps: "punctuation_open",
  Pe: "punctuation_close",
  Pi: "punctuation_initial_quote",
  Pf: "punctuation_final_quote",
  Po: "punctuation_other",
  Sm: "symbol_math",
  Sc: "symbol_currency",
  Sk: "symbol_modifier",
  So: "symbol_other",
  Zs: "separator_space",
  Zl: "separator_line",
  Zp: "separator_paragraph",
  Cc: "other_control",
  Cf: "other_format",
  Cs: "other_surrogate",
  Co: "other_private_use",
  Cn: "other_not_assigned",
};

const bidiMap: Record<string, string> = {
  L: "left_to_right",
  LRE: "left_to_right_embedding",
  LRO: "left_to_right_override",
  R: "right_to_left",
  AL: "right_to_left_arabic",
  RLE: "right_to_left_embedding",
  RLO: "right_to_left_override",
  PDF: "pop_directional_format",
  EN: "european_number",
  ES: "european_number_separator",
  ET: "european_number_terminator",
  AN: "arabic_number",
  CS: "common_number_separator",
  NSM: "nonspacing_mark",
  BN: "boundary_neutral",
  B: "paragraph_separator",
  S: "segment_separator",
  WS: "whitespace",
  ON: "other_neutrals",
  LRI: "left_to_right_isolate",
  RLI: "right_to_left_isolate",
  FSI: "first_strong_isolate",
  PDI: "pop_directional_isolate",
};

const eastAsianWidthMap: Record<string, string> = {
  N: "neutral",
  F: "fullwidth",
  H: "halfwidth",
  W: "wide",
  Na: "narrow",
  A: "ambiguous",
};

const originalGraphemeMap: Record<string, string> = {
  Other: "other",
  Prepend: "prepend",
  CR: "cr",
  LF: "lf",
  Control: "control",
  Extend: "extend",
  Regional_Indicator: "regional_indicator",
  SpacingMark: "spacing_mark",
  L: "l",
  V: "v",
  T: "t",
  LV: "lv",
  LVT: "lvt",
  ZWJ: "zwj",
};

const decompMap: Record<string, string> = {
  font: "font",
  noBreak: "noBreak",
  initial: "initial",
  medial: "medial",
  final: "final",
  isolated: "isolated",
  circle: "circle",
  super: "super",
  sub: "sub",
  vertical: "vertical",
  wide: "wide",
  narrow: "narrow",
  small: "small",
  square: "square",
  fraction: "fraction",
  compat: "compat",
};

const derivedPropNames: Record<string, string> = {
  Math: "is_math",
  Alphabetic: "is_alphabetic",
  Lowercase: "is_lowercase",
  Uppercase: "is_uppercase",
  Cased: "is_cased",
  Case_Ignorable: "is_case_ignorable",
  Changes_When_Lowercased: "changes_when_lowercased",
  Changes_When_Uppercased: "changes_when_uppercased",
  Changes_When_Titlecased: "changes_when_titlecased",
  Changes_When_Casefolded: "changes_when_casefolded",
  Changes_When_Casemapped: "changes_when_casemapped",
  ID_Start: "is_id_start",
  ID_Continue: "is_id_continue",
  XID_Start: "is_xid_start",
  XID_Continue: "is_xid_continue",
  Default_Ignorable_Code_Point: "is_default_ignorable",
  Grapheme_Extend: "is_grapheme_extend",
  Grapheme_Base: "is_grapheme_base",
  Grapheme_Link: "is_grapheme_link",
};

const emojiPropNames: Record<string, string> = {
  Emoji: "is_emoji",
  Emoji_Presentation: "is_emoji_presentation",
  Emoji_Modifier: "is_emoji_modifier",
  Emoji_Modifier_Base: "is_emoji_modifier_base",
  Emoji_Component: "is_emoji_component",
  Extended_Pictographic: "is_extended_pictographic",
};

const propListNames: Record<string, string> = {
  White_Space: "is_white_space",
  ASCII_Hex_Digit: "is_ascii_hex_digit",
  Hex_Digit: "is_hex_digit",
  Dash: "is_dash",
  Diacritic: "is_diacritic",
  Quotation_Mark: "is_quotation_mark",
  Pattern_Syntax: "is_pattern_syntax",
  Pattern_White_Space: "is_pattern_white_space",
  Variation_Selector: "is_variation_selector",
  Noncharacter_Code_Point: "is_noncharacter",
  Unified_Ideograph: "is_unified_ideograph",
};

function fill<T>(value: T): T[] {
  return Array<T>(COUNT).fill(value);
}

function hex(value: string): number {
  return Number.parseInt(value, 16);
}

function parseRange(text: string): [number, number] {
  const [a, b] = text.trim().split("..");
  const start = hex(a!);
  return [start, b ? hex(b) : start];
}

function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/&/g, "and")
    .replace(/[-\s]+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function parseDataLine(line: string): string[] | undefined {
  const body = line.split("#", 1)[0]!.trim();
  if (!body) return undefined;
  return body.split(";").map((part) => part.trim());
}

function setRange<T>(array: T[], start: number, end: number, value: T): void {
  for (let cp = start; cp <= end; cp += 1) array[cp] = value;
}

function toRanges<T>(array: readonly T[], defaultValue: T): Range<T>[] {
  const ranges: Range<T>[] = [];
  let start = 0;
  let value = array[0] ?? defaultValue;
  for (let cp = 1; cp <= array.length; cp += 1) {
    const next = cp === array.length ? undefined : array[cp];
    if (next !== value) {
      if (value !== defaultValue) ranges.push([start, cp - 1, value]);
      start = cp;
      value = next ?? defaultValue;
    }
  }
  return ranges;
}

function toSparse<T>(array: readonly T[], defaultValue: T): Sparse<T>[] {
  const values: Sparse<T>[] = [];
  for (let cp = 0; cp < array.length; cp += 1) {
    if (array[cp] !== defaultValue) values.push([cp, array[cp] as T]);
  }
  return values;
}

function toSparseArray<T>(array: readonly T[][]): Sparse<T[]>[] {
  const values: Sparse<T[]>[] = [];
  for (let cp = 0; cp < array.length; cp += 1) {
    const value = array[cp];
    if (value && value.length > 0) values.push([cp, value]);
  }
  return values;
}

function readLines(path: string): string[] {
  return readFileSync(join(UCD, path), "utf8").split(/\r?\n/);
}

function uniqueSortedValues(values: readonly string[]): string[] {
  // oxlint-disable-next-line unicorn/no-array-sort
  return [...new Set(values)].sort();
}

function typeAlias(name: string, values: readonly string[]): string {
  const literals = uniqueSortedValues(values).map((value) => JSON.stringify(value));
  const singleLine = `export type ${name} = ${literals.join(" | ")};`;
  if (singleLine.length <= 100) return singleLine;
  return `export type ${name} =\n${literals.map((value) => `  | ${value}`).join("\n")};`;
}

function arrayValues(values: readonly (readonly string[])[]): string[] {
  return values.flatMap((value) => value);
}

const names = fill("");
const generalCategory = fill("other_not_assigned");
const canonicalCombiningClass = fill(0);
const bidiClass = fill("left_to_right");
const decompositionType = fill("default");
const decompositionMapping = Array.from({ length: COUNT }, () => [] as number[]);
const numericType = fill("none");
const numericValueDecimal = fill<number | null>(null);
const numericValueDigit = fill<number | null>(null);
const numericValueNumeric = fill("");
const isBidiMirrored = fill(false);
const unicode1Name = fill("");
const simpleUppercaseMapping = Array.from({ length: COUNT }, (_, cp) => cp);
const simpleLowercaseMapping = Array.from({ length: COUNT }, (_, cp) => cp);
const simpleTitlecaseMapping = Array.from({ length: COUNT }, (_, cp) => cp);

let unicodeRangeStart: string[] | undefined;
for (const line of readLines("UnicodeData.txt")) {
  let fields = parseDataLine(line);
  if (!fields) continue;
  const cp = hex(fields[0]!);
  const name = fields[1]!;
  if (name.endsWith(", First>")) {
    unicodeRangeStart = fields;
    continue;
  }
  const start = name.endsWith(", Last>") && unicodeRangeStart ? hex(unicodeRangeStart[0]!) : cp;
  const end = name.endsWith(", Last>") && unicodeRangeStart ? cp : cp;
  if (unicodeRangeStart && name.endsWith(", Last>")) fields = unicodeRangeStart;
  for (let current = start; current <= end; current += 1) {
    names[current] = current === cp ? name : "";
    generalCategory[current] = gcMap[fields[2]!] ?? "other_not_assigned";
    canonicalCombiningClass[current] = Number(fields[3]!);
    bidiClass[current] = bidiMap[fields[4]!] ?? "left_to_right";
    const decomposition = fields[5]!;
    if (decomposition) {
      const pieces = decomposition.split(/\s+/);
      if (pieces[0]?.startsWith("<")) {
        const tag = pieces.shift()!.slice(1, -1);
        decompositionType[current] = decompMap[tag] ?? normalizeName(tag);
      } else {
        decompositionType[current] = "canonical";
      }
      decompositionMapping[current] = pieces.map(hex);
    }
    if (fields[6]) {
      numericType[current] = "decimal";
      numericValueDecimal[current] = Number(fields[6]);
    }
    if (fields[7]) {
      if (numericType[current] === "none") numericType[current] = "digit";
      numericValueDigit[current] = Number(fields[7]);
    }
    if (fields[8]) {
      if (numericType[current] === "none") numericType[current] = "numeric";
      numericValueNumeric[current] = fields[8]!;
    }
    isBidiMirrored[current] = fields[9] === "Y";
    unicode1Name[current] = fields[10]!;
    simpleUppercaseMapping[current] = fields[12] ? hex(fields[12]!) : current;
    simpleLowercaseMapping[current] = fields[13] ? hex(fields[13]!) : current;
    simpleTitlecaseMapping[current] = fields[14] ? hex(fields[14]!) : current;
  }
  if (name.endsWith(", Last>")) unicodeRangeStart = undefined;
}

const caseFoldingTurkishOnly = fill<number | null>(null);
const caseFoldingCommonOnly = fill<number | null>(null);
const caseFoldingSimpleOnly = fill<number | null>(null);
const caseFoldingFullOnly = Array.from({ length: COUNT }, () => [] as number[]);
const caseFoldingSimple = fill(0);
const caseFoldingFull = Array.from({ length: COUNT }, () => [] as number[]);
const foldParent = new Map<number, number>();
for (let cp = 0; cp < COUNT; cp += 1) {
  caseFoldingSimple[cp] = cp;
  caseFoldingFull[cp] = [cp];
}

function foldFind(cp: number): number {
  const parent = foldParent.get(cp);
  if (parent === undefined) {
    foldParent.set(cp, cp);
    return cp;
  }
  if (parent === cp) return cp;
  const foldRoot = foldFind(parent);
  foldParent.set(cp, foldRoot);
  return foldRoot;
}

function foldUnion(a: number, b: number): void {
  const rootA = foldFind(a);
  const rootB = foldFind(b);
  if (rootA === rootB) return;
  if (rootA < rootB) foldParent.set(rootB, rootA);
  else foldParent.set(rootA, rootB);
}

for (const line of readLines("CaseFolding.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const cp = hex(fields[0]!);
  const status = fields[1]!;
  const mapping = fields[2]!.split(/\s+/).map(hex);
  if (status === "T") caseFoldingTurkishOnly[cp] = mapping[0]!;
  if (status === "C") {
    caseFoldingCommonOnly[cp] = mapping[0]!;
    foldUnion(cp, mapping[0]!);
  }
  if (status === "S") {
    caseFoldingSimpleOnly[cp] = mapping[0]!;
    foldUnion(cp, mapping[0]!);
  }
  if (status === "F") caseFoldingFullOnly[cp] = mapping;
}
for (let cp = 0; cp < COUNT; cp += 1) {
  caseFoldingSimple[cp] =
    caseFoldingSimpleOnly[cp] ?? caseFoldingCommonOnly[cp] ?? caseFoldingTurkishOnly[cp] ?? cp;
  caseFoldingFull[cp] = caseFoldingFullOnly[cp]!.length
    ? caseFoldingFullOnly[cp]!
    : [caseFoldingCommonOnly[cp] ?? cp];
}

const simpleFold = fill(0);
const simpleFoldKey = fill(0);
for (let cp = 0; cp < COUNT; cp += 1) simpleFold[cp] = cp;
for (let cp = 0; cp < COUNT; cp += 1) simpleFoldKey[cp] = cp;
const foldGroups = new Map<number, number[]>();
for (const cp of foldParent.keys()) {
  const foldRoot = foldFind(cp);
  const group = foldGroups.get(foldRoot);
  if (group) group.push(cp);
  else foldGroups.set(foldRoot, [cp]);
}
for (const group of foldGroups.values()) {
  if (group.length < 2) continue;
  group.sort((a, b) => a - b);
  const key = group[0]!;
  for (const [index, cp] of group.entries()) {
    simpleFold[cp] = group[(index + 1) % group.length]!;
    simpleFoldKey[cp] = key;
  }
}

const hasSpecialCasing = fill(false);
const specialLowercaseMapping = Array.from({ length: COUNT }, () => [] as number[]);
const specialTitlecaseMapping = Array.from({ length: COUNT }, () => [] as number[]);
const specialUppercaseMapping = Array.from({ length: COUNT }, () => [] as number[]);
const specialCasingCondition = Array.from({ length: COUNT }, () => [] as string[]);
const specialLowercaseMappingConditional = Array.from({ length: COUNT }, () => [] as number[]);
const specialTitlecaseMappingConditional = Array.from({ length: COUNT }, () => [] as number[]);
const specialUppercaseMappingConditional = Array.from({ length: COUNT }, () => [] as number[]);

for (const line of readLines("SpecialCasing.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const cp = hex(fields[0]!);
  const lower = fields[1]!.split(/\s+/).filter(Boolean).map(hex);
  const title = fields[2]!.split(/\s+/).filter(Boolean).map(hex);
  const upper = fields[3]!.split(/\s+/).filter(Boolean).map(hex);
  const conditions = (fields[4] ?? "").split(/\s+/).filter(Boolean).map(normalizeName);
  hasSpecialCasing[cp] = true;
  if (conditions.length === 0) {
    specialLowercaseMapping[cp] = lower;
    specialTitlecaseMapping[cp] = title;
    specialUppercaseMapping[cp] = upper;
  } else {
    specialCasingCondition[cp] = conditions;
    specialLowercaseMappingConditional[cp] = lower;
    specialTitlecaseMappingConditional[cp] = title;
    specialUppercaseMappingConditional[cp] = upper;
  }
}

const lowercaseMapping = Array.from(
  { length: COUNT },
  (_, cp) => [simpleLowercaseMapping[cp]!] as number[],
);
const titlecaseMapping = Array.from(
  { length: COUNT },
  (_, cp) => [simpleTitlecaseMapping[cp]!] as number[],
);
const uppercaseMapping = Array.from(
  { length: COUNT },
  (_, cp) => [simpleUppercaseMapping[cp]!] as number[],
);
for (let cp = 0; cp < COUNT; cp += 1) {
  if (hasSpecialCasing[cp] && specialCasingCondition[cp]!.length === 0) {
    lowercaseMapping[cp] = specialLowercaseMapping[cp]!;
    titlecaseMapping[cp] = specialTitlecaseMapping[cp]!;
    uppercaseMapping[cp] = specialUppercaseMapping[cp]!;
  }
}

const boolFields = Object.fromEntries(
  Object.values(derivedPropNames).map((field) => [field, fill(false)]),
) as Record<string, boolean[]>;
const indicConjunctBreak = fill("none");

for (const line of readLines("DerivedCoreProperties.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const [start, end] = parseRange(fields[0]!);
  if (fields[1] === "InCB") {
    setRange(indicConjunctBreak, start, end, normalizeName(fields[2]!));
    continue;
  }
  const name = derivedPropNames[fields[1]!];
  if (name) setRange(boolFields[name]!, start, end, true);
}

const bidiClassDerived = fill("left_to_right");
for (const line of readLines("extracted/DerivedBidiClass.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(bidiClassDerived, start, end, bidiMap[fields[1]!] ?? "left_to_right");
}

const eastAsianWidth = fill("neutral");
setRange(eastAsianWidth, 0x3400, 0x4dbf, "wide");
setRange(eastAsianWidth, 0x4e00, 0x9fff, "wide");
setRange(eastAsianWidth, 0xf900, 0xfaff, "wide");
setRange(eastAsianWidth, 0x20000, 0x2fffd, "wide");
setRange(eastAsianWidth, 0x30000, 0x3fffd, "wide");
for (const line of readLines("extracted/DerivedEastAsianWidth.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(eastAsianWidth, start, end, eastAsianWidthMap[fields[1]!] ?? "neutral");
}

const originalGraphemeBreak = fill("other");
for (const line of readLines("auxiliary/GraphemeBreakProperty.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(originalGraphemeBreak, start, end, originalGraphemeMap[fields[1]!] ?? "other");
}

const wordBreak = parseRangeFile("auxiliary/WordBreakProperty.txt", "other");
const sentenceBreak = parseRangeFile("auxiliary/SentenceBreakProperty.txt", "other");
const lineBreak = parseRangeFile("LineBreak.txt", "xx");

const emojiFields = Object.fromEntries(
  Object.values(emojiPropNames).map((field) => [field, fill(false)]),
) as Record<string, boolean[]>;
for (const line of readLines("emoji/emoji-data.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const name = emojiPropNames[fields[1]!];
  if (!name) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(emojiFields[name]!, start, end, true);
}

const isEmojiVsBase = fill(false);
for (const line of readLines("emoji/emoji-variation-sequences.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const cps = fields[0]!.split(/\s+/).map(hex);
  if (cps.length === 2 && (cps[1] === 0xfe0e || cps[1] === 0xfe0f)) isEmojiVsBase[cps[0]!] = true;
}

const bidiPairedBracket = Array.from(
  { length: COUNT },
  () => ({ type: "none" }) as { type: string; codePoint?: number },
);
for (const line of readLines("BidiBrackets.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const cp = hex(fields[0]!);
  const paired = hex(fields[1]!);
  bidiPairedBracket[cp] =
    fields[2] === "o"
      ? { type: "open", codePoint: paired }
      : fields[2] === "c"
        ? { type: "close", codePoint: paired }
        : { type: "none" };
}

const bidiMirroring = fill<number | null>(null);
for (const line of readLines("BidiMirroring.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  bidiMirroring[hex(fields[0]!)] = hex(fields[1]!);
}

function parseRangeFile(
  path: string,
  defaultValue: string,
  valueMap: Record<string, string> = {},
): string[] {
  const out = fill(defaultValue);
  for (const line of readLines(path)) {
    const fields = parseDataLine(line);
    if (!fields) continue;
    const [start, end] = parseRange(fields[0]!);
    setRange(out, start, end, valueMap[fields[1]!] ?? normalizeName(fields[1]!));
  }
  return out;
}

const unicodeBlock = parseRangeFile("Blocks.txt", "no_block");
const script = parseRangeFile("Scripts.txt", "unknown");
const joiningType = parseRangeFile("extracted/DerivedJoiningType.txt", "non_joining", {
  C: "join_causing",
  D: "dual_joining",
  L: "left_joining",
  R: "right_joining",
  T: "transparent",
  U: "non_joining",
});
const joiningGroup = parseRangeFile("extracted/DerivedJoiningGroup.txt", "no_joining_group");
const indicPositionalCategory = parseRangeFile("IndicPositionalCategory.txt", "not_applicable");
const indicSyllabicCategory = parseRangeFile("IndicSyllabicCategory.txt", "other");

const isCompositionExclusion = fill(false);
for (const line of readLines("CompositionExclusions.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(isCompositionExclusion, start, end, true);
}

const propListFields = Object.fromEntries(
  Object.values(propListNames).map((field) => [field, fill(false)]),
) as Record<string, boolean[]>;
for (const line of readLines("PropList.txt")) {
  const fields = parseDataLine(line);
  if (!fields) continue;
  const name = propListNames[fields[1]!];
  if (!name) continue;
  const [start, end] = parseRange(fields[0]!);
  setRange(propListFields[name]!, start, end, true);
}

const graphemeBreak = fill("other");
for (let cp = 0; cp < COUNT; cp += 1) {
  const original = originalGraphemeBreak[cp]!;
  const incb = indicConjunctBreak[cp]!;
  if (emojiFields["is_emoji_modifier"]![cp]) graphemeBreak[cp] = "emoji_modifier";
  else if (emojiFields["is_emoji_modifier_base"]![cp]) graphemeBreak[cp] = "emoji_modifier_base";
  else if (emojiFields["is_extended_pictographic"]![cp])
    graphemeBreak[cp] = "extended_pictographic";
  else if (incb === "extend")
    graphemeBreak[cp] = cp === 0x200d ? "zwj" : "indic_conjunct_break_extend";
  else if (incb === "linker") graphemeBreak[cp] = "indic_conjunct_break_linker";
  else if (incb === "consonant") graphemeBreak[cp] = "indic_conjunct_break_consonant";
  else if (original === "extend")
    graphemeBreak[cp] = cp === 0x200c ? "zwnj" : "indic_conjunct_break_extend";
  else graphemeBreak[cp] = original;
}

const graphemeBreakNoControl = graphemeBreak.map((value) =>
  value === "control" || value === "cr" || value === "lf" ? "other" : value,
);

const wcwidthStandalone = fill(1);
const wcwidthZeroInGrapheme = fill(false);
for (let cp = 0; cp < COUNT; cp += 1) {
  const gc = generalCategory[cp]!;
  let width = 1;
  if (
    gc === "other_control" ||
    gc === "other_surrogate" ||
    gc === "separator_line" ||
    gc === "separator_paragraph"
  )
    width = 0;
  else if (cp === 0x00ad) width = 1;
  else if (boolFields["is_default_ignorable"]![cp]) width = 0;
  else if (cp === 0x2e3a) width = 2;
  else if (cp === 0x2e3b) width = 3;
  else if (eastAsianWidth[cp] === "wide" || eastAsianWidth[cp] === "fullwidth") width = 2;
  else if (graphemeBreak[cp] === "regional_indicator") width = 2;
  wcwidthStandalone[cp] = cp === 0x20e3 ? 2 : width;
  wcwidthZeroInGrapheme[cp] =
    width === 0 ||
    emojiFields["is_emoji_modifier"]![cp]! ||
    gc === "mark_nonspacing" ||
    gc === "mark_enclosing" ||
    graphemeBreak[cp] === "v" ||
    graphemeBreak[cp] === "t" ||
    graphemeBreak[cp] === "prepend";
}

const generated = {
  maxCodePoint: MAX,
  ranges: {
    general_category: toRanges(generalCategory, "other_not_assigned"),
    canonical_combining_class: toRanges(canonicalCombiningClass, 0),
    bidi_class: toRanges(bidiClassDerived, "left_to_right"),
    decomposition_type: toRanges(decompositionType, "default"),
    numeric_type: toRanges(numericType, "none"),
    east_asian_width: toRanges(eastAsianWidth, "neutral"),
    word_break: toRanges(wordBreak, "other"),
    sentence_break: toRanges(sentenceBreak, "other"),
    line_break: toRanges(lineBreak, "xx"),
    original_grapheme_break: toRanges(originalGraphemeBreak, "other"),
    indic_conjunct_break: toRanges(indicConjunctBreak, "none"),
    grapheme_break: toRanges(graphemeBreak, "other"),
    grapheme_break_no_control: toRanges(graphemeBreakNoControl, "other"),
    block: toRanges(unicodeBlock, "no_block"),
    script: toRanges(script, "unknown"),
    joining_type: toRanges(joiningType, "non_joining"),
    joining_group: toRanges(joiningGroup, "no_joining_group"),
    indic_positional_category: toRanges(indicPositionalCategory, "not_applicable"),
    indic_syllabic_category: toRanges(indicSyllabicCategory, "other"),
    wcwidth_standalone: toRanges(wcwidthStandalone, 1),
    ...Object.fromEntries(
      Object.entries(boolFields).map(([name, data]) => [name, toRanges(data, false)]),
    ),
    ...Object.fromEntries(
      Object.entries(emojiFields).map(([name, data]) => [name, toRanges(data, false)]),
    ),
    is_emoji_vs_base: toRanges(isEmojiVsBase, false),
    is_composition_exclusion: toRanges(isCompositionExclusion, false),
    ...Object.fromEntries(
      Object.entries(propListFields).map(([name, data]) => [name, toRanges(data, false)]),
    ),
    is_bidi_mirrored: toRanges(isBidiMirrored, false),
    has_special_casing: toRanges(hasSpecialCasing, false),
    wcwidth_zero_in_grapheme: toRanges(wcwidthZeroInGrapheme, false),
  },
  maps: {
    name: toSparse(names, ""),
    decomposition_mapping: toSparseArray(decompositionMapping),
    numeric_value_decimal: toSparse(numericValueDecimal, null),
    numeric_value_digit: toSparse(numericValueDigit, null),
    numeric_value_numeric: toSparse(numericValueNumeric, ""),
    unicode_1_name: toSparse(unicode1Name, ""),
    simple_uppercase_mapping: toSparse(simpleUppercaseMapping, 0).filter(
      ([cp, value]) => cp !== value,
    ),
    simple_lowercase_mapping: toSparse(simpleLowercaseMapping, 0).filter(
      ([cp, value]) => cp !== value,
    ),
    simple_titlecase_mapping: toSparse(simpleTitlecaseMapping, 0).filter(
      ([cp, value]) => cp !== value,
    ),
    case_folding_simple: toSparse(caseFoldingSimple, 0).filter(([cp, value]) => cp !== value),
    simple_fold: toSparse(simpleFold, 0).filter(([cp, value]) => cp !== value),
    simple_fold_key: toSparse(simpleFoldKey, 0).filter(([cp, value]) => cp !== value),
    case_folding_full: toSparseArray(
      caseFoldingFull.map((value, cp) => (value.length === 1 && value[0] === cp ? [] : value)),
    ),
    case_folding_turkish_only: toSparse(caseFoldingTurkishOnly, null),
    case_folding_common_only: toSparse(caseFoldingCommonOnly, null),
    case_folding_simple_only: toSparse(caseFoldingSimpleOnly, null),
    case_folding_full_only: toSparseArray(caseFoldingFullOnly),
    special_lowercase_mapping: toSparseArray(specialLowercaseMapping),
    special_titlecase_mapping: toSparseArray(specialTitlecaseMapping),
    special_uppercase_mapping: toSparseArray(specialUppercaseMapping),
    special_casing_condition: toSparseArray(specialCasingCondition),
    special_lowercase_mapping_conditional: toSparseArray(specialLowercaseMappingConditional),
    special_titlecase_mapping_conditional: toSparseArray(specialTitlecaseMappingConditional),
    special_uppercase_mapping_conditional: toSparseArray(specialUppercaseMappingConditional),
    lowercase_mapping: toSparseArray(
      lowercaseMapping.map((value, cp) => (value.length === 1 && value[0] === cp ? [] : value)),
    ),
    titlecase_mapping: toSparseArray(
      titlecaseMapping.map((value, cp) => (value.length === 1 && value[0] === cp ? [] : value)),
    ),
    uppercase_mapping: toSparseArray(
      uppercaseMapping.map((value, cp) => (value.length === 1 && value[0] === cp ? [] : value)),
    ),
    bidi_paired_bracket: toSparse(bidiPairedBracket, bidiPairedBracket[0]!).filter(
      ([, value]) => value.type !== "none",
    ),
    bidi_mirroring: toSparse(bidiMirroring, null),
  },
};

const gbID: Record<string, number> = {
  other: 0,
  control: 1,
  prepend: 2,
  cr: 3,
  lf: 4,
  regional_indicator: 5,
  spacing_mark: 6,
  l: 7,
  v: 8,
  t: 9,
  lv: 10,
  lvt: 11,
  zwj: 12,
  zwnj: 13,
  extended_pictographic: 14,
  emoji_modifier_base: 15,
  emoji_modifier: 16,
  indic_conjunct_break_extend: 17,
  indic_conjunct_break_linker: 18,
  indic_conjunct_break_consonant: 19,
};

const RUNTIME_WIDTH_MASK = 0x03;
const RUNTIME_ZERO_WIDTH_FLAG = 0x04;
const RUNTIME_EMOJI_VS_FLAG = 0x01;
const BLOCK_SIZE = 256;
const NUM_BLOCKS = Math.ceil(COUNT / BLOCK_SIZE);

function packRuntimeRow(cp: number): number {
  const gb = gbID[graphemeBreak[cp]!] ?? 0;
  let width = wcwidthStandalone[cp]! & RUNTIME_WIDTH_MASK;
  if (wcwidthZeroInGrapheme[cp]) width |= RUNTIME_ZERO_WIDTH_FLAG;
  const flags = isEmojiVsBase[cp] ? RUNTIME_EMOJI_VS_FLAG : 0;
  return gb | (width << 5) | (flags << 8);
}

function buildRuntimeWidthTables(): { stage1: number[]; stage2: number[]; stage3: number[] } {
  const rowIDs = new Map<number, number>();
  const stage3: number[] = [];
  const stage2Blocks = new Map<string, number>();
  const stage1: number[] = [];
  const stage2: number[] = [];

  for (let blockIndex = 0; blockIndex < NUM_BLOCKS; blockIndex += 1) {
    const block: number[] = [];
    for (let i = 0; i < BLOCK_SIZE; i += 1) {
      const cp = blockIndex * BLOCK_SIZE + i;
      const packed = cp <= MAX ? packRuntimeRow(cp) : packRuntimeRow(0);
      let id = rowIDs.get(packed);
      if (id === undefined) {
        id = stage3.length;
        rowIDs.set(packed, id);
        stage3.push(packed);
      }
      block.push(id);
    }
    const key = block.join(",");
    let offset = stage2Blocks.get(key);
    if (offset === undefined) {
      offset = stage2.length;
      stage2Blocks.set(key, offset);
      stage2.push(...block);
    }
    stage1.push(offset);
  }

  return { stage1, stage2, stage3 };
}

const runtimeWidthTables = buildRuntimeWidthTables();
const runtimeWidth = {
  maxCodePoint: MAX,
  widthMask: RUNTIME_WIDTH_MASK,
  zeroWidthFlag: RUNTIME_ZERO_WIDTH_FLAG,
  emojiVSFlag: RUNTIME_EMOJI_VS_FLAG,
  stage1Shift: 8,
  stage2Mask: 0xff,
  stage1: runtimeWidthTables.stage1,
  stage2: runtimeWidthTables.stage2,
  stage3: runtimeWidthTables.stage3,
};

const generatedTypes = `/* This file is generated by scripts/generate.ts. */

${typeAlias("BidiClass", bidiClassDerived)}

${typeAlias("UnicodeBlock", unicodeBlock)}

${typeAlias("DecompositionType", decompositionType)}

${typeAlias("EastAsianWidth", eastAsianWidth)}

${typeAlias("WordBreak", wordBreak)}

${typeAlias("SentenceBreak", sentenceBreak)}

${typeAlias("LineBreak", lineBreak)}

${typeAlias("GeneralCategory", generalCategory)}

${typeAlias("GraphemeBreakProperty", graphemeBreak)}

${typeAlias("GraphemeBreakNoControlProperty", graphemeBreakNoControl)}

${typeAlias("IndicConjunctBreak", indicConjunctBreak)}

${typeAlias("IndicPositionalCategory", indicPositionalCategory)}

${typeAlias("IndicSyllabicCategory", indicSyllabicCategory)}

${typeAlias("JoiningGroup", joiningGroup)}

${typeAlias("JoiningType", joiningType)}

${typeAlias("NumericType", numericType)}

${typeAlias("OriginalGraphemeBreak", originalGraphemeBreak)}

${typeAlias("Script", script)}

${typeAlias("SpecialCasingCondition", arrayValues(specialCasingCondition))}
`;

const out = join(root, "src/generated/tables.ts");
const jsonOut = join(root, "src/generated/tables.json");
const runtimeOut = join(root, "src/generated/runtime_width.ts");
const runtimeJsonOut = join(root, "src/generated/runtime_width.json");
const typesOut = join(root, "src/generated/types.ts");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(jsonOut, JSON.stringify(generated));
writeFileSync(runtimeJsonOut, JSON.stringify(runtimeWidth));
writeFileSync(typesOut, generatedTypes);
writeFileSync(
  out,
  `/* This file is generated by scripts/generate.ts. */\nimport { readFileSync } from "node:fs";\n\nexport const tables = JSON.parse(readFileSync(new URL("./tables.json", import.meta.url), "utf8")) as {\n  maxCodePoint: number;\n  ranges: Record<string, readonly (readonly [number, number, unknown])[]>;\n  maps: Record<string, readonly (readonly [number, unknown])[]>;\n};\n`,
);
writeFileSync(
  runtimeOut,
  `/* This file is generated by scripts/generate.ts. */\nimport { readFileSync } from "node:fs";\n\nconst raw = JSON.parse(readFileSync(new URL("./runtime_width.json", import.meta.url), "utf8")) as {\n  maxCodePoint: number;\n  widthMask: number;\n  zeroWidthFlag: number;\n  emojiVSFlag: number;\n  stage1Shift: number;\n  stage2Mask: number;\n  stage1: number[];\n  stage2: number[];\n  stage3: number[];\n};\n\nexport const runtimeWidth = {\n  maxCodePoint: raw.maxCodePoint,\n  widthMask: raw.widthMask,\n  zeroWidthFlag: raw.zeroWidthFlag,\n  emojiVSFlag: raw.emojiVSFlag,\n  stage1Shift: raw.stage1Shift,\n  stage2Mask: raw.stage2Mask,\n  stage1: Uint16Array.from(raw.stage1),\n  stage2: Uint8Array.from(raw.stage2),\n  stage3: Uint16Array.from(raw.stage3),\n};\n`,
);
