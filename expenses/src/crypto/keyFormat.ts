// Key format: "exk1-" + 52 base32 chars (256-bit key) + 4 checksum chars, grouped by 4.
// The alphabet skips 0/O/1/I so keys survive being read aloud or retyped.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PREFIX = 'exk1';
export const KEY_BYTES = 32;
const BODY_CHARS = Math.ceil((KEY_BYTES * 8) / 5);
const CHECK_CHARS = 4;

export class InvalidKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidKeyError';
  }
}

const toBase32 = (bytes: Uint8Array): string => {
  let out = '';
  let value = 0;
  let bits = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
};

const fromBase32 = (text: string, byteLength: number): Uint8Array => {
  const bytes = new Uint8Array(byteLength);
  let value = 0;
  let bits = 0;
  let index = 0;
  for (const char of text) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) {
      throw new InvalidKeyError(`"${char}" isn't a valid key character.`);
    }
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      if (index >= byteLength) {
        throw new InvalidKeyError('The key is too long.');
      }
      bytes[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
    value &= (1 << bits) - 1;
  }
  if (index !== byteLength || value !== 0) {
    throw new InvalidKeyError('The key is incomplete.');
  }
  return bytes;
};

const checksum = async (raw: Uint8Array): Promise<string> => {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', raw as BufferSource));
  return toBase32(digest.slice(0, 3)).slice(0, CHECK_CHARS);
};

const group = (text: string) => text.match(/.{1,4}/g)?.join('-') ?? text;

export const formatKey = async (raw: Uint8Array): Promise<string> =>
  `${PREFIX}-${group(toBase32(raw) + (await checksum(raw)))}`;

export const generateKey = (): Promise<string> =>
  formatKey(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));

/** Accepts any spacing, dashes or case; throws InvalidKeyError with a user-facing message. */
export const parseKey = async (input: string): Promise<Uint8Array> => {
  let text = (input || '').toUpperCase().replace(/[\s-]/g, '');
  if (text.startsWith(PREFIX.toUpperCase())) {
    text = text.slice(PREFIX.length);
  }
  if (!text) {
    throw new InvalidKeyError('Paste your key first.');
  }
  if (text.length !== BODY_CHARS + CHECK_CHARS) {
    throw new InvalidKeyError("That doesn't look like a full key. Check that you copied all of it.");
  }
  const raw = fromBase32(text.slice(0, BODY_CHARS), KEY_BYTES);
  if ((await checksum(raw)) !== text.slice(BODY_CHARS)) {
    throw new InvalidKeyError('The key has a typo. Check it and try again.');
  }
  return raw;
};

/** Returns the canonical "exk1-…" spelling of a valid key. */
export const normalizeKey = async (input: string): Promise<string> =>
  formatKey(await parseKey(input));
