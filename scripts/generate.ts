import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const UCD = join(root, "ucd");
const MAX = 0x10ffff;
const COUNT = MAX + 1;

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

function propertyNames(values: readonly string[], defaultValue: string): string[] {
  return [defaultValue, ...uniqueSortedValues(values).filter((value) => value !== defaultValue)];
}

function propertyIDs(names: readonly string[]): Record<string, number> {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

function propertyID(prop: string, value: string, ids: Record<string, number>): number {
  const id = ids[value];
  if (id === undefined) throw new Error(`unknown ${prop} property ${JSON.stringify(value)}`);
  return id;
}

function generatedIDObject(name: string, ids: Record<string, number>): string {
  const entries = Object.entries(ids)
    .map(([key, value]) => `  ${key}: ${value},`)
    .join("\n");
  return `export const ${name} = {\n${entries}\n} as const;`;
}

const generalCategory = fill("other_not_assigned");
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
    generalCategory[current] = gcMap[fields[2]!] ?? "other_not_assigned";
    simpleUppercaseMapping[current] = fields[12] ? hex(fields[12]!) : current;
    simpleLowercaseMapping[current] = fields[13] ? hex(fields[13]!) : current;
    simpleTitlecaseMapping[current] = fields[14] ? hex(fields[14]!) : current;
  }
  if (name.endsWith(", Last>")) unicodeRangeStart = undefined;
}

const foldParent = new Map<number, number>();

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
  if (status === "C") {
    foldUnion(cp, mapping[0]!);
  }
  if (status === "S") {
    foldUnion(cp, mapping[0]!);
  }
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

const graphemeBreakNames = [
  "other",
  "control",
  "prepend",
  "cr",
  "lf",
  "regional_indicator",
  "spacing_mark",
  "l",
  "v",
  "t",
  "lv",
  "lvt",
  "zwj",
  "zwnj",
  "extended_pictographic",
  "emoji_modifier_base",
  "emoji_modifier",
  "indic_conjunct_break_extend",
  "indic_conjunct_break_linker",
  "indic_conjunct_break_consonant",
];
const graphemeBreakIDs = propertyIDs(graphemeBreakNames);
const generalCategoryNames = propertyNames(generalCategory, "other_not_assigned");
const generalCategoryIDs = propertyIDs(generalCategoryNames);
const eastAsianWidthNames = propertyNames(eastAsianWidth, "neutral");
const eastAsianWidthIDs = propertyIDs(eastAsianWidthNames);
const wordBreakNames = propertyNames(wordBreak, "other");
const wordBreakIDs = propertyIDs(wordBreakNames);
const sentenceBreakNames = propertyNames(sentenceBreak, "other");
const sentenceBreakIDs = propertyIDs(sentenceBreakNames);
const lineBreakNames = propertyNames(lineBreak, "xx");
const lineBreakIDs = propertyIDs(lineBreakNames);

const RUNTIME_WIDTH_MASK = 0x03;
const RUNTIME_ZERO_WIDTH_FLAG = 0x04;
const RUNTIME_EMOJI_VS_FLAG = 0x01;
const RUNTIME_EMOJI_PRESENTATION_FLAG = 0x02;
const RUNTIME_EXTENDED_PICTOGRAPHIC_FLAG = 0x04;
const RUNTIME_WHITE_SPACE_FLAG = 0x08;
const RUNTIME_ASCII_HEX_DIGIT_FLAG = 1 << 0;
const RUNTIME_HEX_DIGIT_FLAG = 1 << 1;
const RUNTIME_DASH_FLAG = 1 << 2;
const RUNTIME_DIACRITIC_FLAG = 1 << 3;
const RUNTIME_QUOTATION_MARK_FLAG = 1 << 4;
const RUNTIME_PATTERN_SYNTAX_FLAG = 1 << 5;
const RUNTIME_PATTERN_WHITE_SPACE_FLAG = 1 << 6;
const RUNTIME_VARIATION_SELECTOR_FLAG = 1 << 7;
const RUNTIME_NONCHARACTER_FLAG = 1 << 8;
const RUNTIME_UNIFIED_IDEOGRAPH_FLAG = 1 << 9;
const BLOCK_SIZE = 256;
const NUM_BLOCKS = Math.ceil(COUNT / BLOCK_SIZE);

type CodeRange = readonly [number, number];

const runewidthNonprint: readonly CodeRange[] = [
  [0x070f, 0x070f],
  [0x180b, 0x180e],
  [0x200b, 0x200f],
  [0x2028, 0x202e],
  [0x206a, 0x206f],
  [0xfeff, 0xfeff],
  [0xfff9, 0xfffb],
  [0xfffe, 0xffff],
];

const runewidthCombining: readonly CodeRange[] = [
  [0x0300, 0x036f],
  [0x0483, 0x0489],
  [0x07eb, 0x07f3],
  [0x0c00, 0x0c00],
  [0x0c04, 0x0c04],
  [0x0cf3, 0x0cf3],
  [0x0d00, 0x0d01],
  [0x135d, 0x135f],
  [0x180b, 0x180d],
  [0x180f, 0x180f],
  [0x1a7f, 0x1a7f],
  [0x1ab0, 0x1add],
  [0x1ae0, 0x1aeb],
  [0x1b6b, 0x1b73],
  [0x1dc0, 0x1dff],
  [0x20d0, 0x20f0],
  [0x2cef, 0x2cf1],
  [0x2de0, 0x2dff],
  [0x3099, 0x309a],
  [0xa66f, 0xa672],
  [0xa674, 0xa67d],
  [0xa69e, 0xa69f],
  [0xa6f0, 0xa6f1],
  [0xa8e0, 0xa8f1],
  [0xfe00, 0xfe0f],
  [0xfe20, 0xfe2f],
  [0x101fd, 0x101fd],
  [0x10376, 0x1037a],
  [0x10eab, 0x10eac],
  [0x10f46, 0x10f50],
  [0x10f82, 0x10f85],
  [0x11300, 0x11301],
  [0x1133b, 0x1133c],
  [0x11366, 0x1136c],
  [0x11370, 0x11374],
  [0x16af0, 0x16af4],
  [0x1cf00, 0x1cf2d],
  [0x1cf30, 0x1cf46],
  [0x1d165, 0x1d169],
  [0x1d16d, 0x1d172],
  [0x1d17b, 0x1d182],
  [0x1d185, 0x1d18b],
  [0x1d1aa, 0x1d1ad],
  [0x1d242, 0x1d244],
  [0x1e000, 0x1e006],
  [0x1e008, 0x1e018],
  [0x1e01b, 0x1e021],
  [0x1e023, 0x1e024],
  [0x1e026, 0x1e02a],
  [0x1e08f, 0x1e08f],
  [0x1e8d0, 0x1e8d6],
  [0xe0100, 0xe01ef],
];

function inCodeRanges(cp: number, ranges: readonly CodeRange[]): boolean {
  let lo = 0;
  let hi = ranges.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ranges[mid]![1] >= cp) hi = mid;
    else lo = mid + 1;
  }
  return lo < ranges.length && ranges[lo]![0] <= cp;
}

const wcwidthStandalone = fill(1);
const wcwidthZeroInGrapheme = fill(false);
for (let cp = 0; cp < COUNT; cp += 1) {
  const gc = generalCategory[cp]!;
  let width = 1;
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || cp === 0x00ad || (cp >= 0xd800 && cp <= 0xdfff))
    width = 0;
  else if (cp < 0x300) width = 1;
  else if (inCodeRanges(cp, runewidthNonprint) || inCodeRanges(cp, runewidthCombining)) width = 0;
  else if (eastAsianWidth[cp] === "wide" || eastAsianWidth[cp] === "fullwidth") width = 2;
  wcwidthStandalone[cp] = width;
  wcwidthZeroInGrapheme[cp] =
    width === 0 ||
    emojiFields["is_emoji_modifier"]![cp]! ||
    gc === "mark_nonspacing" ||
    gc === "mark_enclosing" ||
    graphemeBreak[cp] === "v" ||
    graphemeBreak[cp] === "t" ||
    graphemeBreak[cp] === "prepend";
}

type RuntimeRow = {
  gb: number;
  width: number;
  wb: number;
  sb: number;
  lb: number;
  eaw: number;
  gc: number;
  flags: number;
  flags2: number;
  upperDelta: number;
  lowerDelta: number;
  titleDelta: number;
  foldDelta: number;
  foldKeyDelta: number;
};

const defaultRuntimeRow: RuntimeRow = {
  gb: graphemeBreakIDs["other"]!,
  width: 1,
  wb: wordBreakIDs["other"]!,
  sb: sentenceBreakIDs["other"]!,
  lb: lineBreakIDs["xx"]!,
  eaw: eastAsianWidthIDs["neutral"]!,
  gc: generalCategoryIDs["other_not_assigned"]!,
  flags: 0,
  flags2: 0,
  upperDelta: 0,
  lowerDelta: 0,
  titleDelta: 0,
  foldDelta: 0,
  foldKeyDelta: 0,
};

function runtimeRowKey(row: RuntimeRow): string {
  return [
    row.gb,
    row.width,
    row.wb,
    row.sb,
    row.lb,
    row.eaw,
    row.gc,
    row.flags,
    row.flags2,
    row.upperDelta,
    row.lowerDelta,
    row.titleDelta,
    row.foldDelta,
    row.foldKeyDelta,
  ].join(",");
}

function buildRuntimePropertyTables(): {
  stage1: number[];
  stage2: number[];
  gb: number[];
  width: number[];
  wb: number[];
  sb: number[];
  lb: number[];
  eaw: number[];
  gc: number[];
  flags: number[];
  flags2: number[];
  upperDelta: number[];
  lowerDelta: number[];
  titleDelta: number[];
  foldDelta: number[];
  foldKeyDelta: number[];
} {
  const rowIDs = new Map<string, number>();
  const stage1: number[] = [];
  const stage2: number[] = [];
  const stage2Blocks = new Map<string, number>();
  const out = {
    stage1,
    stage2,
    gb: [] as number[],
    width: [] as number[],
    wb: [] as number[],
    sb: [] as number[],
    lb: [] as number[],
    eaw: [] as number[],
    gc: [] as number[],
    flags: [] as number[],
    flags2: [] as number[],
    upperDelta: [] as number[],
    lowerDelta: [] as number[],
    titleDelta: [] as number[],
    foldDelta: [] as number[],
    foldKeyDelta: [] as number[],
  };

  function pushRow(row: RuntimeRow): number {
    const key = runtimeRowKey(row);
    const existing = rowIDs.get(key);
    if (existing !== undefined) return existing;
    const id = out.gb.length;
    rowIDs.set(key, id);
    out.gb.push(row.gb);
    out.width.push(row.width);
    out.wb.push(row.wb);
    out.sb.push(row.sb);
    out.lb.push(row.lb);
    out.eaw.push(row.eaw);
    out.gc.push(row.gc);
    out.flags.push(row.flags);
    out.flags2.push(row.flags2);
    out.upperDelta.push(row.upperDelta);
    out.lowerDelta.push(row.lowerDelta);
    out.titleDelta.push(row.titleDelta);
    out.foldDelta.push(row.foldDelta);
    out.foldKeyDelta.push(row.foldKeyDelta);
    return id;
  }

  pushRow(defaultRuntimeRow);

  for (let blockIndex = 0; blockIndex < NUM_BLOCKS; blockIndex += 1) {
    const block: number[] = [];
    for (let i = 0; i < BLOCK_SIZE; i += 1) {
      const cp = blockIndex * BLOCK_SIZE + i;
      if (cp > MAX) {
        block.push(0);
        continue;
      }

      let width = wcwidthStandalone[cp]! & RUNTIME_WIDTH_MASK;
      if (wcwidthZeroInGrapheme[cp]) width |= RUNTIME_ZERO_WIDTH_FLAG;

      let flags = 0;
      if (isEmojiVsBase[cp]) flags |= RUNTIME_EMOJI_VS_FLAG;
      if (emojiFields["is_emoji_presentation"]![cp]) flags |= RUNTIME_EMOJI_PRESENTATION_FLAG;
      if (emojiFields["is_extended_pictographic"]![cp]) flags |= RUNTIME_EXTENDED_PICTOGRAPHIC_FLAG;
      if (propListFields["is_white_space"]![cp]) flags |= RUNTIME_WHITE_SPACE_FLAG;

      let flags2 = 0;
      if (propListFields["is_ascii_hex_digit"]![cp]) flags2 |= RUNTIME_ASCII_HEX_DIGIT_FLAG;
      if (propListFields["is_hex_digit"]![cp]) flags2 |= RUNTIME_HEX_DIGIT_FLAG;
      if (propListFields["is_dash"]![cp]) flags2 |= RUNTIME_DASH_FLAG;
      if (propListFields["is_diacritic"]![cp]) flags2 |= RUNTIME_DIACRITIC_FLAG;
      if (propListFields["is_quotation_mark"]![cp]) flags2 |= RUNTIME_QUOTATION_MARK_FLAG;
      if (propListFields["is_pattern_syntax"]![cp]) flags2 |= RUNTIME_PATTERN_SYNTAX_FLAG;
      if (propListFields["is_pattern_white_space"]![cp]) flags2 |= RUNTIME_PATTERN_WHITE_SPACE_FLAG;
      if (propListFields["is_variation_selector"]![cp]) flags2 |= RUNTIME_VARIATION_SELECTOR_FLAG;
      if (propListFields["is_noncharacter"]![cp]) flags2 |= RUNTIME_NONCHARACTER_FLAG;
      if (propListFields["is_unified_ideograph"]![cp]) flags2 |= RUNTIME_UNIFIED_IDEOGRAPH_FLAG;

      block.push(
        pushRow({
          gb: propertyID("grapheme_break", graphemeBreak[cp]!, graphemeBreakIDs),
          width,
          wb: propertyID("word_break", wordBreak[cp]!, wordBreakIDs),
          sb: propertyID("sentence_break", sentenceBreak[cp]!, sentenceBreakIDs),
          lb: propertyID("line_break", lineBreak[cp]!, lineBreakIDs),
          eaw: propertyID("east_asian_width", eastAsianWidth[cp]!, eastAsianWidthIDs),
          gc: propertyID("general_category", generalCategory[cp]!, generalCategoryIDs),
          flags,
          flags2,
          upperDelta: simpleUppercaseMapping[cp]! - cp,
          lowerDelta: simpleLowercaseMapping[cp]! - cp,
          titleDelta: simpleTitlecaseMapping[cp]! - cp,
          foldDelta: simpleFold[cp]! - cp,
          foldKeyDelta: simpleFoldKey[cp]! - cp,
        }),
      );
    }

    const key = block.join(",");
    let offset = stage2Blocks.get(key);
    if (offset === undefined) {
      offset = out.stage2.length;
      stage2Blocks.set(key, offset);
      out.stage2.push(...block);
    }
    out.stage1.push(offset);
  }

  return out;
}

const runtimePropertyTables = buildRuntimePropertyTables();
const runtimeProps = {
  maxCodePoint: MAX,
  widthMask: RUNTIME_WIDTH_MASK,
  zeroWidthFlag: RUNTIME_ZERO_WIDTH_FLAG,
  emojiVSFlag: RUNTIME_EMOJI_VS_FLAG,
  emojiPresentationFlag: RUNTIME_EMOJI_PRESENTATION_FLAG,
  extendedPictographicFlag: RUNTIME_EXTENDED_PICTOGRAPHIC_FLAG,
  whiteSpaceFlag: RUNTIME_WHITE_SPACE_FLAG,
  asciiHexDigitFlag: RUNTIME_ASCII_HEX_DIGIT_FLAG,
  hexDigitFlag: RUNTIME_HEX_DIGIT_FLAG,
  dashFlag: RUNTIME_DASH_FLAG,
  diacriticFlag: RUNTIME_DIACRITIC_FLAG,
  quotationMarkFlag: RUNTIME_QUOTATION_MARK_FLAG,
  patternSyntaxFlag: RUNTIME_PATTERN_SYNTAX_FLAG,
  patternWhiteSpaceFlag: RUNTIME_PATTERN_WHITE_SPACE_FLAG,
  variationSelectorFlag: RUNTIME_VARIATION_SELECTOR_FLAG,
  noncharacterFlag: RUNTIME_NONCHARACTER_FLAG,
  unifiedIdeographFlag: RUNTIME_UNIFIED_IDEOGRAPH_FLAG,
  stage1Shift: 8,
  stage2Mask: 0xff,
  stage1: runtimePropertyTables.stage1,
  stage2: runtimePropertyTables.stage2,
  gb: runtimePropertyTables.gb,
  width: runtimePropertyTables.width,
  wb: runtimePropertyTables.wb,
  sb: runtimePropertyTables.sb,
  lb: runtimePropertyTables.lb,
  eaw: runtimePropertyTables.eaw,
  gc: runtimePropertyTables.gc,
  flags: runtimePropertyTables.flags,
  flags2: runtimePropertyTables.flags2,
  upperDelta: runtimePropertyTables.upperDelta,
  lowerDelta: runtimePropertyTables.lowerDelta,
  titleDelta: runtimePropertyTables.titleDelta,
  foldDelta: runtimePropertyTables.foldDelta,
  foldKeyDelta: runtimePropertyTables.foldKeyDelta,
  graphemeBreakNames,
  generalCategoryNames,
  eastAsianWidthNames,
  wordBreakNames,
  sentenceBreakNames,
  lineBreakNames,
};

function packRuntimeRow(cp: number): number {
  const gb = graphemeBreakIDs[graphemeBreak[cp]!] ?? 0;
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

${typeAlias("EastAsianWidth", eastAsianWidth)}

${typeAlias("WordBreak", wordBreak)}

${typeAlias("SentenceBreak", sentenceBreak)}

${typeAlias("LineBreak", lineBreak)}

${typeAlias("GeneralCategory", generalCategory)}

${typeAlias("GraphemeBreakProperty", graphemeBreak)}

${typeAlias("GraphemeBreakNoControlProperty", graphemeBreakNoControl)}
`;

const runtimeOut = join(root, "src/generated/runtime_width.ts");
const runtimeJsonOut = join(root, "src/generated/runtime_width.json");
const runtimePropsOut = join(root, "src/generated/runtime_props.ts");
const runtimePropsJsonOut = join(root, "src/generated/runtime_props.json");
const typesOut = join(root, "src/generated/types.ts");
mkdirSync(dirname(runtimeOut), { recursive: true });
writeFileSync(runtimeJsonOut, JSON.stringify(runtimeWidth));
writeFileSync(runtimePropsJsonOut, JSON.stringify(runtimeProps));
writeFileSync(typesOut, generatedTypes);
writeFileSync(
  runtimeOut,
  `/* This file is generated by scripts/generate.ts. */\nimport { readFileSync } from "node:fs";\n\nconst raw = JSON.parse(readFileSync(new URL("./runtime_width.json", import.meta.url), "utf8")) as {\n  maxCodePoint: number;\n  widthMask: number;\n  zeroWidthFlag: number;\n  emojiVSFlag: number;\n  stage1Shift: number;\n  stage2Mask: number;\n  stage1: number[];\n  stage2: number[];\n  stage3: number[];\n};\n\nexport const runtimeWidth = {\n  maxCodePoint: raw.maxCodePoint,\n  widthMask: raw.widthMask,\n  zeroWidthFlag: raw.zeroWidthFlag,\n  emojiVSFlag: raw.emojiVSFlag,\n  stage1Shift: raw.stage1Shift,\n  stage2Mask: raw.stage2Mask,\n  stage1: Uint16Array.from(raw.stage1),\n  stage2: Uint8Array.from(raw.stage2),\n  stage3: Uint16Array.from(raw.stage3),\n};\n`,
);
writeFileSync(
  runtimePropsOut,
  `/* This file is generated by scripts/generate.ts. */\nimport { readFileSync } from "node:fs";\n\nconst raw = JSON.parse(readFileSync(new URL("./runtime_props.json", import.meta.url), "utf8")) as {\n  maxCodePoint: number;\n  widthMask: number;\n  zeroWidthFlag: number;\n  emojiVSFlag: number;\n  emojiPresentationFlag: number;\n  extendedPictographicFlag: number;\n  whiteSpaceFlag: number;\n  asciiHexDigitFlag: number;\n  hexDigitFlag: number;\n  dashFlag: number;\n  diacriticFlag: number;\n  quotationMarkFlag: number;\n  patternSyntaxFlag: number;\n  patternWhiteSpaceFlag: number;\n  variationSelectorFlag: number;\n  noncharacterFlag: number;\n  unifiedIdeographFlag: number;\n  stage1Shift: number;\n  stage2Mask: number;\n  stage1: number[];\n  stage2: number[];\n  gb: number[];\n  width: number[];\n  wb: number[];\n  sb: number[];\n  lb: number[];\n  eaw: number[];\n  gc: number[];\n  flags: number[];\n  flags2: number[];\n  upperDelta: number[];\n  lowerDelta: number[];\n  titleDelta: number[];\n  foldDelta: number[];\n  foldKeyDelta: number[];\n  graphemeBreakNames: string[];\n  generalCategoryNames: string[];\n  eastAsianWidthNames: string[];\n  wordBreakNames: string[];\n  sentenceBreakNames: string[];\n  lineBreakNames: string[];\n};\n\nexport const runtimeProps = {\n  maxCodePoint: raw.maxCodePoint,\n  widthMask: raw.widthMask,\n  zeroWidthFlag: raw.zeroWidthFlag,\n  emojiVSFlag: raw.emojiVSFlag,\n  emojiPresentationFlag: raw.emojiPresentationFlag,\n  extendedPictographicFlag: raw.extendedPictographicFlag,\n  whiteSpaceFlag: raw.whiteSpaceFlag,\n  asciiHexDigitFlag: raw.asciiHexDigitFlag,\n  hexDigitFlag: raw.hexDigitFlag,\n  dashFlag: raw.dashFlag,\n  diacriticFlag: raw.diacriticFlag,\n  quotationMarkFlag: raw.quotationMarkFlag,\n  patternSyntaxFlag: raw.patternSyntaxFlag,\n  patternWhiteSpaceFlag: raw.patternWhiteSpaceFlag,\n  variationSelectorFlag: raw.variationSelectorFlag,\n  noncharacterFlag: raw.noncharacterFlag,\n  unifiedIdeographFlag: raw.unifiedIdeographFlag,\n  stage1Shift: raw.stage1Shift,\n  stage2Mask: raw.stage2Mask,\n  stage1: Uint32Array.from(raw.stage1),\n  stage2: Uint32Array.from(raw.stage2),\n  gb: Uint8Array.from(raw.gb),\n  width: Uint8Array.from(raw.width),\n  wb: Uint8Array.from(raw.wb),\n  sb: Uint8Array.from(raw.sb),\n  lb: Uint8Array.from(raw.lb),\n  eaw: Uint8Array.from(raw.eaw),\n  gc: Uint8Array.from(raw.gc),\n  flags: Uint8Array.from(raw.flags),\n  flags2: Uint16Array.from(raw.flags2),\n  upperDelta: Int32Array.from(raw.upperDelta),\n  lowerDelta: Int32Array.from(raw.lowerDelta),\n  titleDelta: Int32Array.from(raw.titleDelta),\n  foldDelta: Int32Array.from(raw.foldDelta),\n  foldKeyDelta: Int32Array.from(raw.foldKeyDelta),\n  graphemeBreakNames: raw.graphemeBreakNames,\n  generalCategoryNames: raw.generalCategoryNames,\n  eastAsianWidthNames: raw.eastAsianWidthNames,\n  wordBreakNames: raw.wordBreakNames,\n  sentenceBreakNames: raw.sentenceBreakNames,\n  lineBreakNames: raw.lineBreakNames,\n};\n\n${generatedIDObject("graphemeBreakIDs", graphemeBreakIDs)}\n\n${generatedIDObject("generalCategoryIDs", generalCategoryIDs)}\n\n${generatedIDObject("eastAsianWidthIDs", eastAsianWidthIDs)}\n\n${generatedIDObject("wordBreakIDs", wordBreakIDs)}\n\n${generatedIDObject("sentenceBreakIDs", sentenceBreakIDs)}\n\n${generatedIDObject("lineBreakIDs", lineBreakIDs)}\n`,
);
