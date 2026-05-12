import { tables } from "./generated/tables.js";
import type {
  BidiClass,
  DecompositionType,
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakNoControlProperty,
  GraphemeBreakProperty,
  IndicConjunctBreak,
  IndicPositionalCategory,
  IndicSyllabicCategory,
  JoiningGroup,
  JoiningType,
  NumericType,
  OriginalGraphemeBreak,
  Script,
  SpecialCasingCondition,
  UnicodeBlock,
} from "./generated/types.js";

export type {
  BidiClass,
  DecompositionType,
  EastAsianWidth,
  GeneralCategory,
  GraphemeBreakNoControlProperty,
  GraphemeBreakProperty,
  IndicConjunctBreak,
  IndicPositionalCategory,
  IndicSyllabicCategory,
  JoiningGroup,
  JoiningType,
  NumericType,
  OriginalGraphemeBreak,
  Script,
  SpecialCasingCondition,
  UnicodeBlock,
} from "./generated/types.js";

export type CodePoint = number;
export type BidiPairedBracket =
  | { type: "none" }
  | { type: "open"; codePoint: number }
  | { type: "close"; codePoint: number };

export interface FieldValueMap {
  bidi_class: BidiClass;
  bidi_mirroring: number | null;
  bidi_paired_bracket: BidiPairedBracket;
  block: UnicodeBlock;
  canonical_combining_class: number;
  case_folding_common_only: number | null;
  case_folding_full: number[];
  case_folding_full_only: number[];
  case_folding_simple: number;
  case_folding_simple_only: number | null;
  case_folding_turkish_only: number | null;
  changes_when_casefolded: boolean;
  changes_when_casemapped: boolean;
  changes_when_lowercased: boolean;
  changes_when_titlecased: boolean;
  changes_when_uppercased: boolean;
  decomposition_mapping: number[];
  decomposition_type: DecompositionType;
  east_asian_width: EastAsianWidth;
  general_category: GeneralCategory;
  grapheme_break: GraphemeBreakProperty;
  grapheme_break_no_control: GraphemeBreakNoControlProperty;
  has_special_casing: boolean;
  indic_conjunct_break: IndicConjunctBreak;
  indic_positional_category: IndicPositionalCategory;
  indic_syllabic_category: IndicSyllabicCategory;
  is_alphabetic: boolean;
  is_bidi_mirrored: boolean;
  is_case_ignorable: boolean;
  is_cased: boolean;
  is_composition_exclusion: boolean;
  is_default_ignorable: boolean;
  is_emoji: boolean;
  is_emoji_component: boolean;
  is_emoji_modifier: boolean;
  is_emoji_modifier_base: boolean;
  is_emoji_presentation: boolean;
  is_emoji_vs_base: boolean;
  is_extended_pictographic: boolean;
  is_grapheme_base: boolean;
  is_grapheme_extend: boolean;
  is_grapheme_link: boolean;
  is_id_continue: boolean;
  is_id_start: boolean;
  is_lowercase: boolean;
  is_math: boolean;
  is_uppercase: boolean;
  is_xid_continue: boolean;
  is_xid_start: boolean;
  joining_group: JoiningGroup;
  joining_type: JoiningType;
  lowercase_mapping: number[];
  name: string;
  numeric_type: NumericType;
  numeric_value_decimal: number | null;
  numeric_value_digit: number | null;
  numeric_value_numeric: string;
  original_grapheme_break: OriginalGraphemeBreak;
  script: Script;
  simple_lowercase_mapping: number;
  simple_titlecase_mapping: number;
  simple_uppercase_mapping: number;
  special_casing_condition: SpecialCasingCondition[];
  special_lowercase_mapping: number[];
  special_lowercase_mapping_conditional: number[];
  special_titlecase_mapping: number[];
  special_titlecase_mapping_conditional: number[];
  special_uppercase_mapping: number[];
  special_uppercase_mapping_conditional: number[];
  titlecase_mapping: number[];
  unicode_1_name: string;
  uppercase_mapping: number[];
  wcwidth_standalone: number;
  wcwidth_zero_in_grapheme: boolean;
}

export type Field = keyof FieldValueMap;
export type FieldValueFor<K extends Field> = FieldValueMap[K];
export type FieldValue = FieldValueMap[Field];
export type UnicodeProperties = FieldValueMap;
type FieldsMatching<T> = { [K in Field]: FieldValueMap[K] extends T ? K : never }[Field];

export type NumberField = FieldsMatching<number>;
export type NullableNumberField = {
  [K in Field]: FieldValueMap[K] extends number | null
    ? null extends FieldValueMap[K]
      ? K
      : never
    : never;
}[Field];
export type BooleanField = FieldsMatching<boolean>;
export type CodePointArrayField = FieldsMatching<number[]>;
export type StringArrayField = FieldsMatching<string[]>;
export type BidiPairedBracketField = FieldsMatching<BidiPairedBracket>;
export type StringField = FieldsMatching<string>;

const numberFields = [
  "canonical_combining_class",
  "case_folding_simple",
  "simple_lowercase_mapping",
  "simple_titlecase_mapping",
  "simple_uppercase_mapping",
  "wcwidth_standalone",
] as const satisfies readonly NumberField[];

const nullableNumberFields = [
  "bidi_mirroring",
  "case_folding_common_only",
  "case_folding_simple_only",
  "case_folding_turkish_only",
  "numeric_value_decimal",
  "numeric_value_digit",
] as const satisfies readonly NullableNumberField[];

const booleanFields = [
  "changes_when_casefolded",
  "changes_when_casemapped",
  "changes_when_lowercased",
  "changes_when_titlecased",
  "changes_when_uppercased",
  "has_special_casing",
  "is_alphabetic",
  "is_bidi_mirrored",
  "is_case_ignorable",
  "is_cased",
  "is_composition_exclusion",
  "is_default_ignorable",
  "is_emoji",
  "is_emoji_component",
  "is_emoji_modifier",
  "is_emoji_modifier_base",
  "is_emoji_presentation",
  "is_emoji_vs_base",
  "is_extended_pictographic",
  "is_grapheme_base",
  "is_grapheme_extend",
  "is_grapheme_link",
  "is_id_continue",
  "is_id_start",
  "is_lowercase",
  "is_math",
  "is_uppercase",
  "is_xid_continue",
  "is_xid_start",
  "wcwidth_zero_in_grapheme",
] as const satisfies readonly BooleanField[];

const codePointArrayFields = [
  "case_folding_full",
  "case_folding_full_only",
  "decomposition_mapping",
  "lowercase_mapping",
  "special_lowercase_mapping",
  "special_lowercase_mapping_conditional",
  "special_titlecase_mapping",
  "special_titlecase_mapping_conditional",
  "special_uppercase_mapping",
  "special_uppercase_mapping_conditional",
  "titlecase_mapping",
  "uppercase_mapping",
] as const satisfies readonly CodePointArrayField[];

const stringArrayFields = [
  "special_casing_condition",
] as const satisfies readonly StringArrayField[];
const bidiPairedBracketFields = [
  "bidi_paired_bracket",
] as const satisfies readonly BidiPairedBracketField[];

const stringFields = [
  "bidi_class",
  "block",
  "decomposition_type",
  "east_asian_width",
  "general_category",
  "grapheme_break",
  "grapheme_break_no_control",
  "indic_conjunct_break",
  "indic_positional_category",
  "indic_syllabic_category",
  "joining_group",
  "joining_type",
  "name",
  "numeric_type",
  "numeric_value_numeric",
  "original_grapheme_break",
  "script",
  "unicode_1_name",
] as const satisfies readonly StringField[];

const fields = [
  ...numberFields,
  ...nullableNumberFields,
  ...booleanFields,
  ...codePointArrayFields,
  ...stringArrayFields,
  ...bidiPairedBracketFields,
  ...stringFields,
] as const satisfies readonly Field[];

const fieldSet = new Set<string>(fields);
const rangeFields = new Set<string>(Object.keys(tables.ranges));
const mapFields = new Set<string>(Object.keys(tables.maps));

const defaults: { [K in Field]: FieldValueFor<K> } = {
  bidi_class: "left_to_right",
  bidi_mirroring: null,
  bidi_paired_bracket: { type: "none" },
  block: "no_block",
  canonical_combining_class: 0,
  case_folding_common_only: null,
  case_folding_full: [],
  case_folding_full_only: [],
  case_folding_simple: 0,
  case_folding_simple_only: null,
  case_folding_turkish_only: null,
  changes_when_casefolded: false,
  changes_when_casemapped: false,
  changes_when_lowercased: false,
  changes_when_titlecased: false,
  changes_when_uppercased: false,
  decomposition_mapping: [],
  decomposition_type: "default",
  east_asian_width: "neutral",
  general_category: "other_not_assigned",
  grapheme_break: "other",
  grapheme_break_no_control: "other",
  has_special_casing: false,
  indic_conjunct_break: "none",
  indic_positional_category: "not_applicable",
  indic_syllabic_category: "other",
  is_alphabetic: false,
  is_bidi_mirrored: false,
  is_case_ignorable: false,
  is_cased: false,
  is_composition_exclusion: false,
  is_default_ignorable: false,
  is_emoji: false,
  is_emoji_component: false,
  is_emoji_modifier: false,
  is_emoji_modifier_base: false,
  is_emoji_presentation: false,
  is_emoji_vs_base: false,
  is_extended_pictographic: false,
  is_grapheme_base: false,
  is_grapheme_extend: false,
  is_grapheme_link: false,
  is_id_continue: false,
  is_id_start: false,
  is_lowercase: false,
  is_math: false,
  is_uppercase: false,
  is_xid_continue: false,
  is_xid_start: false,
  joining_group: "no_joining_group",
  joining_type: "non_joining",
  lowercase_mapping: [],
  name: "",
  numeric_type: "none",
  numeric_value_decimal: null,
  numeric_value_digit: null,
  numeric_value_numeric: "",
  original_grapheme_break: "other",
  script: "unknown",
  simple_lowercase_mapping: 0,
  simple_titlecase_mapping: 0,
  simple_uppercase_mapping: 0,
  special_casing_condition: [],
  special_lowercase_mapping: [],
  special_lowercase_mapping_conditional: [],
  special_titlecase_mapping: [],
  special_titlecase_mapping_conditional: [],
  special_uppercase_mapping: [],
  special_uppercase_mapping_conditional: [],
  titlecase_mapping: [],
  unicode_1_name: "",
  uppercase_mapping: [],
  wcwidth_standalone: 1,
  wcwidth_zero_in_grapheme: false,
};

const cpDefaultFields = new Set<Field>([
  "case_folding_simple",
  "simple_lowercase_mapping",
  "simple_titlecase_mapping",
  "simple_uppercase_mapping",
]);

const cpArrayDefaultFields = new Set<Field>([
  "case_folding_full",
  "lowercase_mapping",
  "titlecase_mapping",
  "uppercase_mapping",
]);

function assertCodePoint(cp: number): void {
  if (!Number.isInteger(cp) || cp < 0 || cp > tables.maxCodePoint) {
    throw new RangeError(`Invalid Unicode code point: ${cp}`);
  }
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return [...value] as T;
  if (value && typeof value === "object") return { ...value } as T;
  return value;
}

function rangeGet(field: Field, cp: number): FieldValue {
  const ranges = tables.ranges[field] as readonly (readonly [number, number, FieldValue])[];
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end, value] = ranges[mid]!;
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return cloneValue(value);
  }
  return cloneValue(defaults[field]);
}

function mapGet(field: Field, cp: number): FieldValue | undefined {
  const values = tables.maps[field] as readonly (readonly [number, FieldValue])[];
  let lo = 0;
  let hi = values.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [key, value] = values[mid]!;
    if (cp < key) hi = mid - 1;
    else if (cp > key) lo = mid + 1;
    else return cloneValue(value);
  }
  return undefined;
}

export function hasField(field: string): field is Field {
  return fieldSet.has(field);
}

export function get<K extends Field>(field: K, cp: CodePoint): FieldValueFor<K> {
  assertCodePoint(cp);
  let value: FieldValue;
  if (rangeFields.has(field)) value = rangeGet(field, cp);
  else {
    const mapped = mapFields.has(field) ? mapGet(field, cp) : undefined;
    if (mapped !== undefined) value = mapped;
    else if (cpDefaultFields.has(field)) value = cp;
    else if (cpArrayDefaultFields.has(field)) value = [cp];
    else value = cloneValue(defaults[field]);
  }
  return value as FieldValueFor<K>;
}

export function getNumber(field: NumberField, cp: CodePoint): number {
  return get(field, cp);
}

export function getString(field: StringField, cp: CodePoint): string {
  return get(field, cp);
}

export function getBoolean(field: BooleanField, cp: CodePoint): boolean {
  return get(field, cp);
}

export function getCodePoints(field: CodePointArrayField, cp: CodePoint): number[] {
  return get(field, cp);
}

export function getProperties(cp: CodePoint): UnicodeProperties {
  assertCodePoint(cp);
  const out = {} as UnicodeProperties;
  for (const field of fields) out[field] = get(field, cp) as never;
  return out;
}
