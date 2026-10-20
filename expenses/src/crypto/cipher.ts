const VERSION = 'v1';
const IV_BYTES = 12;

export interface PlainPayload {
  v: 1;
  sum: string;
  dt: string;
  dsc: string;
  cat?: string;
}

export class DecryptError extends Error {
  constructor(message = "Couldn't decrypt this item") {
    super(message);
    this.name = 'DecryptError';
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): Uint8Array => {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

/** Binds a payload to its owner and bundle, so it can't be moved to another user or type. */
export const aadFor = (uid: string | number, type: string) => `exp:${VERSION}:${uid}:${type}`;

export const importKey = (raw: Uint8Array): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);

export const encryptPayload = async (
  key: CryptoKey,
  plain: PlainPayload,
  aad: string
): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(aad) },
    key,
    encoder.encode(JSON.stringify(plain))
  );
  return `${VERSION}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
};

export const decryptPayload = async (
  key: CryptoKey,
  payload: string,
  aad: string
): Promise<PlainPayload> => {
  const [version, ivPart, dataPart] = (payload || '').trim().split('.');
  if (version !== VERSION || !ivPart || !dataPart) {
    throw new DecryptError('Unknown payload format');
  }
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64Url(ivPart) as BufferSource,
        additionalData: encoder.encode(aad),
      },
      key,
      fromBase64Url(dataPart) as BufferSource
    );
  } catch {
    throw new DecryptError();
  }
  const parsed = JSON.parse(decoder.decode(plaintext));
  if (!parsed || parsed.v !== 1 || typeof parsed.sum !== 'string' || typeof parsed.dt !== 'string') {
    throw new DecryptError('Unexpected payload contents');
  }
  return {
    v: 1,
    sum: parsed.sum,
    dt: parsed.dt,
    dsc: typeof parsed.dsc === 'string' ? parsed.dsc : '',
    ...(typeof parsed.cat === 'string' ? { cat: parsed.cat } : {}),
  };
};

const normalizeSum = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(4) : (value || '').trim();
};

/** Compares the fields that matter, ignoring formatting differences like "125.5" vs "125.50". */
export const samePlain = (a: PlainPayload, b: PlainPayload) =>
  normalizeSum(a.sum) === normalizeSum(b.sum) &&
  (a.dt || '').slice(0, 10) === (b.dt || '').slice(0, 10) &&
  (a.dsc || '').trim() === (b.dsc || '').trim() &&
  (a.cat || '') === (b.cat || '');
