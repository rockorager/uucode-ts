import { codePointWidth, get, stringWidth } from "../src/index.js";

const samples = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  "α",
  "∀",
  "😀",
  "👨🏻‍❤️‍👨🏿",
  "क्‍ष",
  "中",
];

const codePoints = samples.flatMap((sample) => [...sample].map((char) => char.codePointAt(0)!));
const iterations = 250_000;
const widthIterations = 250_000;
const benchmarkStrings = [
  { name: "ASCII", s: "The quick brown fox jumps over the lazy dog. 0123456789" },
  {
    name: "Combining",
    s: "A\u0300B e\u0301 o\u0300 n\u0303 c\u0327 A\u0300B e\u0301 o\u0300 n\u0303 c\u0327",
  },
  { name: "Emoji", s: "😀😅😻👺👩🏽‍🚀🇨🇭👨🏻‍🍼👨🏻‍❤️‍👨🏿" },
  { name: "Mixed", s: "ASCII A\u0300 👩🏽‍🚀 🇨🇭 क्‍ष 한글 😀 _ end" },
];

function bench(name: string, fn: () => unknown): number {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) fn();
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
  console.log(`${name}: ${elapsed.toFixed(2)}ms`);
  return elapsed;
}

function benchWidth(name: string, fn: () => unknown): void {
  const start = process.hrtime.bigint();
  for (let i = 0; i < widthIterations; i += 1) fn();
  const elapsedNs = Number(process.hrtime.bigint() - start);
  const nsPerOp = elapsedNs / widthIterations;
  console.log(`${name}: ${(elapsedNs / 1e6).toFixed(2)}ms (${nsPerOp.toFixed(1)} ns/op)`);
}

let i = 0;
bench("uucode-ts general_category", () =>
  get("general_category", codePoints[(i = (i + 1) % codePoints.length)]!));

i = 0;
bench("native RegExp Unicode property", () =>
  /\p{Alphabetic}/u.test(String.fromCodePoint(codePoints[(i = (i + 1) % codePoints.length)]!)));

i = 0;
bench("uucode-ts is_alphabetic", () =>
  get("is_alphabetic", codePoints[(i = (i + 1) % codePoints.length)]!));

for (const { name, s } of benchmarkStrings) {
  benchWidth(`uucode-ts width/${name}`, () => stringWidth(s));
}

i = 0;
bench("uucode-ts codePointWidth", () =>
  codePointWidth(codePoints[(i = (i + 1) % codePoints.length)]!));
