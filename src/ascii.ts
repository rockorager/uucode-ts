export function isAlphanumeric(c: number): boolean {
  return isDigit(c) || isAlphabetic(c);
}

export function isAlphabetic(c: number): boolean {
  return isUpper(c) || isLower(c);
}

export function isControl(c: number): boolean {
  return c <= 0x1f || c === 0x7f;
}

export function isDigit(c: number): boolean {
  return c >= 0x30 && c <= 0x39;
}

export function isLower(c: number): boolean {
  return c >= 0x61 && c <= 0x7a;
}

export function isPrint(c: number): boolean {
  return isAscii(c) && !isControl(c);
}

export function isWhitespace(c: number): boolean {
  return c === 0x20 || (c >= 0x09 && c <= 0x0d);
}

export function isUpper(c: number): boolean {
  return c >= 0x41 && c <= 0x5a;
}

export function isHex(c: number): boolean {
  return isDigit(c) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

export function isAscii(c: number): boolean {
  return c >= 0 && c < 128;
}

export function toUpper(c: number): number {
  return isLower(c) ? c ^ 0x20 : c;
}

export function toLower(c: number): number {
  return isUpper(c) ? c | 0x20 : c;
}
