const HEX: readonly string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, "0"),
);

/**
 * Returns a new UUID version 4 (RFC 9562 §5.4), lowercase, in the
 * 8-4-4-4-12 form. It uses `crypto.getRandomValues`, which, unlike
 * `crypto.randomUUID`, every browser offers outside secure contexts too.
 */
export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  // Version 4 in the high nibble of byte 6; variant 10 in the top bits of byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  let out = "";
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) out += "-";
    out += HEX[bytes[i] ?? 0];
  }
  return out;
}
