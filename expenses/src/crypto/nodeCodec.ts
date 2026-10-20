// The only place where items cross the encryption boundary:
// decodeServerItem (Drupal -> app) and encodeNodeBody (app -> Drupal).
// Everything on the device (IndexedDB, offline queue, UI) stays plain.
import { TransactionOrIncomeItem } from '../types/types';
import { aadFor, decryptPayload, encryptPayload, PlainPayload } from './cipher';
import { getEncryptionSnapshot, getSession } from './encryptionState';
import { getCryptoKey } from './keyStore';

export const ENCRYPTED_TITLE = '•';

export type DecodeResult =
  | { kind: 'ok'; item: TransactionOrIncomeItem }
  | { kind: 'locked'; id: string }
  | { kind: 'corrupt'; id: string };

export type EncodeResult =
  | { kind: 'send'; body: Record<string, unknown> }
  | { kind: 'hold'; reason: 'status-unknown' | 'transition' | 'key-needed' };

const first = (value: any): any => {
  const entry = Array.isArray(value) ? value[0] : value;
  if (entry && typeof entry === 'object') {
    return entry.value ?? entry.target_id;
  }
  return entry;
};

const hasCategory = (type: string) => type === 'transaction';

/** Works with both the /api/expenses list rows and full node JSON. */
export const extractPayload = (record: any): string | null => {
  const value = record?.payload ?? first(record?.field_encrypted_payload);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const recordType = (record: any): string =>
  typeof record?.type === 'string' ? record.type : first(record?.type) || '';

export const toPlain = (
  type: string,
  values: { sum?: unknown; dt?: unknown; dsc?: unknown; cat?: unknown }
): PlainPayload => ({
  v: 1,
  sum: values.sum === undefined || values.sum === null ? '' : String(values.sum),
  dt: values.dt ? String(values.dt) : '',
  dsc: values.dsc ? String(values.dsc) : '',
  ...(hasCategory(type) ? { cat: values.cat ? String(values.cat) : '' } : {}),
});

export const plainFromFormData = (data: any): PlainPayload =>
  toPlain(data.type, {
    sum: first(data.field_amount),
    dt: first(data.field_date),
    dsc: first(data.field_description),
    cat: first(data.field_category),
  });

/** Node body with every sensitive field emptied (the payload is sent separately or already stored). */
export const encryptedNodeShell = (type: string): Record<string, unknown> => ({
  type,
  title: [ENCRYPTED_TITLE],
  field_amount: [],
  field_date: [],
  field_description: [],
  ...(hasCategory(type) ? { field_category: [] } : {}),
});

export const plainNodeBody = (type: string, plain: PlainPayload): Record<string, unknown> => ({
  type,
  title: [plain.dt],
  field_amount: [plain.sum],
  field_date: [plain.dt],
  field_description: [plain.dsc],
  ...(hasCategory(type) ? { field_category: [plain.cat || ''] } : {}),
});

/** Overlays the decrypted values on an item built from the plain fields. */
export const decodeServerItem = async (
  record: any,
  base: TransactionOrIncomeItem
): Promise<DecodeResult> => {
  const payload = extractPayload(record);
  if (!payload) {
    return { kind: 'ok', item: base };
  }
  const session = getSession();
  const key = await getCryptoKey();
  if (!key || !session) {
    return { kind: 'locked', id: base.id };
  }
  try {
    const plain = await decryptPayload(key, payload, aadFor(session.uid, base.type));
    return {
      kind: 'ok',
      item: { ...base, sum: plain.sum, dt: plain.dt, dsc: plain.dsc, cat: plain.cat ?? '' },
    };
  } catch {
    return { kind: 'corrupt', id: base.id };
  }
};

/** Builds the POST/PATCH body at send time, so the status at that moment decides the format. */
export const encodeNodeBody = async (data: any): Promise<EncodeResult> => {
  const { status } = getEncryptionSnapshot();
  if (status === 'off') {
    return { kind: 'send', body: data };
  }
  if (status === null) {
    return { kind: 'hold', reason: 'status-unknown' };
  }
  if (status !== 'on') {
    return { kind: 'hold', reason: 'transition' };
  }
  const session = getSession();
  const key = await getCryptoKey();
  if (!key || !session) {
    return { kind: 'hold', reason: 'key-needed' };
  }
  const type = data.type;
  const payload = await encryptPayload(key, plainFromFormData(data), aadFor(session.uid, type));
  return {
    kind: 'send',
    body: { ...encryptedNodeShell(type), field_encrypted_payload: [payload] },
  };
};
