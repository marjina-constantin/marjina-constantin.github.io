import { importKey } from './cipher';
import { normalizeKey, parseKey } from './keyFormat';

const STORAGE_KEY = 'expensesEncryptionKey';

let cached: { text: string; key: Promise<CryptoKey> } | null = null;

export const getKeyText = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const hasStoredKey = () => !!getKeyText();

/** Validates the key, stores its canonical spelling and returns it. */
export const saveKeyText = async (input: string): Promise<string> => {
  const text = await normalizeKey(input);
  localStorage.setItem(STORAGE_KEY, text);
  cached = null;
  return text;
};

export const clearKeyText = () => {
  localStorage.removeItem(STORAGE_KEY);
  cached = null;
};

export const toCryptoKey = async (text: string): Promise<CryptoKey> =>
  importKey(await parseKey(text));

export const getCryptoKey = async (): Promise<CryptoKey | null> => {
  const text = getKeyText();
  if (!text) {
    cached = null;
    return null;
  }
  if (!cached || cached.text !== text) {
    cached = { text, key: toCryptoKey(text) };
  }
  try {
    return await cached.key;
  } catch {
    cached = null;
    return null;
  }
};
