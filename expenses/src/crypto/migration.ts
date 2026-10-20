// Lock / unlock engine. Stateless towards the server: every round re-reads /api/expenses and works
// out what's left from the items themselves, so it can resume anywhere, on any device with the key.
//
// Per item, nothing is removed before the other representation exists and is verified on the server:
//   lock:    plain -> plain + payload -> verify -> payload only
//   unlock:  payload -> payload + plain -> verify -> plain only
import { useSyncExternalStore } from 'react';
import { ROOT_URL } from '../utils/constants';
import { getExpensesFromDB, getOfflineQueue } from '../utils/indexedDB';
import { aadFor, decryptPayload, encryptPayload, PlainPayload, samePlain } from './cipher';
import {
  EncryptionStatus,
  forgetKey,
  getEncryptionSnapshot,
  getSession,
  setMigrationActive,
  setStatus,
} from './encryptionState';
import { getCryptoKey, toCryptoKey } from './keyStore';
import {
  encryptedNodeShell,
  extractPayload,
  plainNodeBody,
  recordType,
  toPlain,
} from './nodeCodec';

export type Direction = 'lock' | 'unlock';
export type Phase = 'prepare' | 'transform' | 'verify' | 'cleanup' | 'finalize';
export type RunState = 'idle' | 'running' | 'paused' | 'failed' | 'done';

export interface ItemFailure {
  id: string;
  dt: string;
  sum: string;
  reason: string;
}

export interface TransitionProgress {
  state: RunState;
  direction: Direction | null;
  phase: Phase;
  /** Highest step reached in this run (0 transform, 1 verify, 2 clean up, 3 finished); never goes back. */
  step: number;
  phaseDone: number;
  phaseTotal: number;
  itemsTotal: number;
  percent: number;
  etaMs: number | null;
  message: string | null;
  failures: ItemFailure[];
}

const CONCURRENCY = 8;
const PACE_EVERY = 50;
const PACE_MS = 300;
const RETRY_DELAYS_MS = [1000, 3000, 9000, 27000];
const MAX_ROUNDS = 3;
const ETA_MIN_SAMPLES = 20;
const MIN_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

// Item progress, so the bar reflects real server state on resume too.
const SCORE_TRANSFORMED = 0.45;
const SCORE_VERIFIED = 0.55;
const SCORE_DONE = 1;

class PauseSignal extends Error {}
class KeyMismatchError extends Error {}
class ItemError extends Error {}

interface ListRecord {
  id: string;
  type: string;
  dt?: string | null;
  sum?: string | null;
  dsc?: string | null;
  cat?: string | null;
  payload?: string | null;
}

type ItemState = 'P' | 'D' | 'E' | 'X';

const idleProgress: TransitionProgress = {
  state: 'idle',
  direction: null,
  phase: 'prepare',
  step: 0,
  phaseDone: 0,
  phaseTotal: 0,
  itemsTotal: 0,
  percent: 0,
  etaMs: null,
  message: null,
  failures: [],
};

let progress: TransitionProgress = idleProgress;
let running = false;
let pauseRequested = false;
let afterDone: (() => Promise<void>) | null = null;
const listeners = new Set<() => void>();
const scores = new Map<string, number>();
const requestTimes: number[] = [];
const failures = new Map<string, ItemFailure>();

const PHASE_STEP: Record<Phase, number> = {
  prepare: 0,
  transform: 0,
  verify: 1,
  cleanup: 2,
  finalize: 3,
};

const emit = (patch: Partial<TransitionProgress>) => {
  const next = { ...progress, ...patch };
  if (patch.phase && patch.step === undefined) {
    next.step = Math.max(progress.step, PHASE_STEP[patch.phase]);
  }
  progress = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getTransitionProgress = () => progress;
export const useTransitionProgress = () => useSyncExternalStore(subscribe, getTransitionProgress);
export const isTransitionRunning = () => running;

export const requestPause = () => {
  if (running) {
    pauseRequested = true;
    emit({ message: 'Pausing after the current items…' });
  }
};

/** Clears a finished (or failed) run from the UI. */
export const dismissTransition = () => {
  if (!running) emit({ ...idleProgress });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkPause = () => {
  if (pauseRequested) throw new PauseSignal('Paused.');
};

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

const refreshPercent = () => {
  const total = scores.size;
  let sum = 0;
  let remainingRequests = 0;
  scores.forEach((score) => {
    sum += score;
    if (score < SCORE_TRANSFORMED) remainingRequests += 2;
    else if (score < SCORE_DONE) remainingRequests += 1;
  });

  let etaMs: number | null = null;
  if (requestTimes.length >= ETA_MIN_SAMPLES) {
    const span = requestTimes[requestTimes.length - 1] - requestTimes[0];
    const perRequest = span / (requestTimes.length - 1);
    etaMs = Math.round(remainingRequests * perRequest);
  }

  emit({
    itemsTotal: total,
    percent: total ? Math.min(100, (sum / total) * 100) : 100,
    etaMs,
  });
};

const setScore = (id: string, score: number) => {
  scores.set(id, Math.max(scores.get(id) ?? 0, score));
  refreshPercent();
};

const recordRequest = () => {
  requestTimes.push(Date.now());
  if (requestTimes.length > ETA_MIN_SAMPLES) requestTimes.shift();
};

const addFailure = (record: ListRecord, reason: string) => {
  failures.set(record.id, {
    id: record.id,
    dt: record.dt || '',
    sum: record.sum || '',
    reason,
  });
  emit({ failures: Array.from(failures.values()) });
};

// ---------------------------------------------------------------------------
// HTTP with retry
// ---------------------------------------------------------------------------

const jsonHeaders = (token: string) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'JWT-Authorization': `Bearer ${token}`,
});

const sessionExpired = async (token: string) => {
  try {
    const response = await fetch(`${ROOT_URL}/jwt/token`, { headers: jsonHeaders(token) });
    return response.status === 403;
  } catch {
    return false;
  }
};

const readErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();
    if (body?.message) return String(body.message);
  } catch {
    // Not JSON.
  }
  return `HTTP ${response.status}`;
};

const waitBeforeRetry = async (ms: number) => {
  for (let left = Math.ceil(ms / 1000); left > 0; left -= 1) {
    checkPause();
    if (!navigator.onLine) {
      throw new PauseSignal("You're offline. Continue when you're back online.");
    }
    emit({ message: `Server didn't respond. Retrying in ${left}s…` });
    await sleep(1000);
  }
  emit({ message: null });
};

type RequestResult = { gone: true } | { gone: false; data: any };

const request = async (method: string, path: string, body?: unknown): Promise<RequestResult> => {
  for (let attempt = 0; ; attempt += 1) {
    checkPause();
    const session = getSession();
    if (!session) {
      throw new PauseSignal('You were logged out. Log in again to continue.');
    }
    if (!navigator.onLine) {
      throw new PauseSignal("You're offline. Continue when you're back online.");
    }

    let response: Response | null = null;
    try {
      response = await fetch(`${ROOT_URL}${path}`, {
        method,
        headers: jsonHeaders(session.token),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      response = null;
    }

    if (response) {
      if (response.ok) {
        recordRequest();
        const data = response.status === 204 ? null : await response.json().catch(() => null);
        return { gone: false, data };
      }
      if (response.status === 404) {
        return { gone: true };
      }
      if (response.status === 403) {
        if (await sessionExpired(session.token)) {
          throw new PauseSignal(
            'Your session expired. Log out, log in again and continue. You\'ll need your key.'
          );
        }
        throw new ItemError('Access denied (403).');
      }
      if (response.status !== 429 && response.status < 500) {
        throw new ItemError(await readErrorMessage(response));
      }
    }

    if (attempt >= RETRY_DELAYS_MS.length) {
      throw new PauseSignal("The server isn't responding. Try again in a bit.");
    }
    await waitBeforeRetry(RETRY_DELAYS_MS[attempt]);
  }
};

const fetchList = async (): Promise<ListRecord[]> => {
  const result = await request('GET', '/api/expenses');
  if (result.gone || !Array.isArray(result.data)) {
    throw new Error("Couldn't load your items from the server.");
  }
  return result.data.map((row: any) => ({
    ...row,
    id: String(row.id),
    type: recordType(row),
  }));
};

const patchNode = (record: ListRecord, body: Record<string, unknown>) =>
  request('PATCH', `/node/${record.id}?_format=json`, body);

const saveStatus = async (status: EncryptionStatus) => {
  const session = getSession();
  if (!session) throw new PauseSignal('Log in again to continue.');
  const result = await request('PATCH', `/user/${session.uid}?_format=json`, {
    field_encryption_status: [{ value: status }],
  });
  const saved = !result.gone && result.data?.field_encryption_status?.[0]?.value;
  if (saved !== status) {
    throw new Error("Couldn't save the lock status on your profile.");
  }
  setStatus(status);
};

// ---------------------------------------------------------------------------
// Item logic
// ---------------------------------------------------------------------------

const hasPlain = (record: ListRecord) =>
  (record.sum !== null && record.sum !== undefined && record.sum !== '') || !!record.dt;

const itemState = (record: ListRecord): ItemState => {
  const plain = hasPlain(record);
  const payload = !!extractPayload(record);
  if (plain && payload) return 'D';
  if (plain) return 'P';
  if (payload) return 'E';
  return 'X';
};

const plainOf = (record: ListRecord): PlainPayload =>
  toPlain(record.type, { sum: record.sum, dt: record.dt, dsc: record.dsc, cat: record.cat });

const isDone = (state: ItemState, direction: Direction) =>
  state === 'X' || state === (direction === 'lock' ? 'E' : 'P');

const initialScore = (state: ItemState, direction: Direction) => {
  if (isDone(state, direction)) return SCORE_DONE;
  return state === 'D' ? SCORE_TRANSFORMED : 0;
};

const decryptRecord = (key: CryptoKey, uid: string, record: ListRecord) =>
  decryptPayload(key, extractPayload(record) || '', aadFor(uid, record.type));

const bothVersionsMatch = async (key: CryptoKey, uid: string, record: ListRecord) => {
  try {
    return samePlain(await decryptRecord(key, uid, record), plainOf(record));
  } catch {
    return false;
  }
};

/** A key that decrypts none of the existing payloads is the wrong key; stop before writing anything. */
const assertKeyMatches = async (key: CryptoKey, uid: string, records: ListRecord[]) => {
  const samples = records.filter((record) => extractPayload(record)).slice(0, 5);
  if (!samples.length) return;
  for (const record of samples) {
    try {
      await decryptRecord(key, uid, record);
      return;
    } catch {
      // Try the next one.
    }
  }
  throw new KeyMismatchError("This key doesn't match your data.");
};

const transformItem = async (
  direction: Direction,
  key: CryptoKey,
  uid: string,
  record: ListRecord
): Promise<boolean> => {
  let body: Record<string, unknown>;
  if (direction === 'lock') {
    const plain = plainOf(record);
    const aad = aadFor(uid, record.type);
    const payload = await encryptPayload(key, plain, aad);
    if (!samePlain(await decryptPayload(key, payload, aad), plain)) {
      addFailure(record, "Encryption check failed. The item wasn't changed.");
      return false;
    }
    body = { type: record.type, field_encrypted_payload: [payload] };
  } else {
    let plain: PlainPayload;
    try {
      plain = await decryptRecord(key, uid, record);
    } catch {
      addFailure(record, "Couldn't decrypt this item. It was left as is.");
      return false;
    }
    body = plainNodeBody(record.type, plain);
  }

  const result = await patchNode(record, body);
  setScore(record.id, result.gone ? SCORE_DONE : SCORE_TRANSFORMED);
  return !result.gone;
};

const cleanupItem = async (direction: Direction, record: ListRecord) => {
  const body =
    direction === 'lock'
      ? encryptedNodeShell(record.type)
      : { type: record.type, field_encrypted_payload: [] };
  await patchNode(record, body);
  setScore(record.id, SCORE_DONE);
};

/** Runs items with limited concurrency. Item errors are recorded; pause/stop signals abort the pool. */
const runPool = async (
  records: ListRecord[],
  phaseLabel: Phase,
  worker: (record: ListRecord) => Promise<void>
) => {
  let index = 0;
  let done = 0;
  let sent = 0;
  let stop: unknown = null;
  emit({ phase: phaseLabel, phaseDone: 0, phaseTotal: records.length });

  const next = async () => {
    while (stop === null && index < records.length) {
      const record = records[index++];
      try {
        checkPause();
        await worker(record);
      } catch (error) {
        if (error instanceof ItemError) {
          addFailure(record, error.message);
        } else {
          stop = error;
          return;
        }
      }
      done += 1;
      sent += 1;
      emit({ phaseDone: done });
      if (sent % PACE_EVERY === 0) await sleep(PACE_MS);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, records.length) }, next));
  if (stop !== null) throw stop;
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const runRound = async (
  direction: Direction,
  key: CryptoKey,
  uid: string,
  records: ListRecord[]
): Promise<boolean> => {
  const transform: ListRecord[] = [];
  const toVerify: ListRecord[] = [];
  for (const record of records) {
    if (failures.has(record.id)) continue;
    const state = itemState(record);
    if (isDone(state, direction)) continue;
    if (state === 'D') toVerify.push(record);
    else transform.push(record);
  }
  if (!transform.length && !toVerify.length) return false;

  const cleanup: ListRecord[] = [];
  if (toVerify.length) {
    emit({ phase: 'verify', phaseDone: 0, phaseTotal: toVerify.length });
  }
  for (const [index, record] of toVerify.entries()) {
    if (await bothVersionsMatch(key, uid, record)) {
      cleanup.push(record);
      setScore(record.id, SCORE_VERIFIED);
    } else if (direction === 'lock') {
      // The plain fields are what the user saw before locking; only the payload gets rewritten.
      transform.push(record);
    } else {
      addFailure(record, 'This item has two different versions. It was left as is.');
    }
    emit({ phaseDone: index + 1 });
  }

  if (transform.length) {
    const written: ListRecord[] = [];
    await runPool(transform, 'transform', async (record) => {
      if (await transformItem(direction, key, uid, record)) written.push(record);
    });

    if (written.length) {
      emit({ phase: 'verify', phaseDone: 0, phaseTotal: written.length });
      const fresh = new Map((await fetchList()).map((record) => [record.id, record]));
      for (const [index, record] of written.entries()) {
        const current = fresh.get(record.id);
        if (!current) {
          setScore(record.id, SCORE_DONE);
        } else if (itemState(current) === 'D' && (await bothVersionsMatch(key, uid, current))) {
          cleanup.push(current);
          setScore(record.id, SCORE_VERIFIED);
        } else {
          addFailure(record, "The server didn't keep the change. It was left as is.");
        }
        emit({ phaseDone: index + 1 });
      }
    }
  }

  if (cleanup.length) {
    await runPool(cleanup, 'cleanup', (record) => cleanupItem(direction, record));
  }
  return true;
};

export interface StartOptions {
  /** Runs once after a successful finish (e.g. deleting the key from Drive after unlock). */
  afterDone?: () => Promise<void>;
}

export const startTransition = async (direction: Direction, options: StartOptions = {}) => {
  if (running) return;
  running = true;
  pauseRequested = false;
  if (options.afterDone) afterDone = options.afterDone;
  scores.clear();
  failures.clear();
  requestTimes.length = 0;
  setMigrationActive(true);
  emit({
    ...idleProgress,
    state: 'running',
    direction,
    message: null,
  });

  try {
    const session = getSession();
    if (!session) throw new PauseSignal('Log in again to continue.');
    const key = await getCryptoKey();
    if (!key) throw new PauseSignal('Your key is needed to continue.');

    let records = await fetchList();
    await assertKeyMatches(key, session.uid, records);

    const transit: EncryptionStatus = direction === 'lock' ? 'migrating' : 'unlocking';
    if (getEncryptionSnapshot().status !== transit) {
      await saveStatus(transit);
    }

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      scores.clear();
      records.forEach((record) => scores.set(record.id, initialScore(itemState(record), direction)));
      refreshPercent();
      const didWork = await runRound(direction, key, session.uid, records);
      records = await fetchList();
      if (!didWork) break;
    }

    emit({ phase: 'finalize', phaseDone: 0, phaseTotal: 1 });
    const remaining = records.filter(
      (record) => !isDone(itemState(record), direction) && !failures.has(record.id)
    );
    if (failures.size || remaining.length) {
      emit({
        state: 'failed',
        message:
          failures.size > 0
            ? `${failures.size} item${failures.size === 1 ? ' needs' : 's need'} attention. Nothing was lost.`
            : "Some items couldn't be processed. Nothing was lost. Try again.",
      });
      return;
    }

    await saveStatus(direction === 'lock' ? 'on' : 'off');
    if (direction === 'unlock') {
      forgetKey();
    }
    const finish = afterDone;
    afterDone = null;
    if (finish) {
      await finish().catch((error) => console.warn('After-finish step failed', error));
    }
    emit({ state: 'done', step: 3, percent: 100, phaseDone: 1, etaMs: null, message: null });
  } catch (error) {
    if (error instanceof PauseSignal) {
      emit({ state: 'paused', message: error.message, etaMs: null });
    } else {
      console.error('Lock/unlock stopped', error);
      emit({
        state: 'failed',
        etaMs: null,
        message:
          error instanceof KeyMismatchError
            ? error.message
            : `${(error as Error)?.message || 'Something went wrong.'} Nothing was lost. Try again.`,
      });
    }
  } finally {
    running = false;
    pauseRequested = false;
    setMigrationActive(false);
  }
};

/** Continues whatever the account is in the middle of. */
export const resumeTransition = () => {
  const { status } = getEncryptionSnapshot();
  if (status === 'migrating') return startTransition('lock');
  if (status === 'unlocking') return startTransition('unlock');
  return Promise.resolve();
};

/** Cancelling a lock means unlocking whatever was already encrypted. */
export const cancelLock = () => startTransition('unlock');

// ---------------------------------------------------------------------------
// Checks used by the wizards and the key screen
// ---------------------------------------------------------------------------

const tokenExpiresAt = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export interface PreflightCheck {
  id: string;
  label: string;
  ok: boolean;
  hint?: string;
}

/** Everything must pass before a lock or unlock starts. `flush` sends pending changes first. */
export const runPreflight = async (flush: () => Promise<void>): Promise<PreflightCheck[]> => {
  const session = getSession();
  const online = navigator.onLine;
  const checks: PreflightCheck[] = [
    {
      id: 'online',
      label: "You're online",
      ok: online,
      hint: 'Connect to the internet and try again.',
    },
  ];

  const expiresAt = session ? tokenExpiresAt(session.token) : null;
  checks.push({
    id: 'session',
    label: 'Your session is valid for at least another hour',
    ok: !!session && (expiresAt === null || expiresAt - Date.now() > MIN_TOKEN_LIFETIME_MS),
    hint: 'Log out and log in again, then retry.',
  });

  if (online) {
    try {
      await flush();
    } catch {
      // Reported by the queue check below.
    }
  }
  const queue = await getOfflineQueue();
  checks.push({
    id: 'queue',
    label: 'All your changes are synced',
    ok: queue.length === 0,
    hint: `${queue.length} change${queue.length === 1 ? '' : 's'} still waiting to sync. Wait for them, then retry.`,
  });

  const cached = (await getExpensesFromDB()) || [];
  const failedCount = cached.filter((item) => item.failed).length;
  checks.push({
    id: 'failed',
    label: 'No items failed to sync',
    ok: failedCount === 0,
    hint: `${failedCount} item${failedCount === 1 ? '' : 's'} failed to sync. Edit or delete them first.`,
  });

  let serverOk = false;
  if (online && session) {
    try {
      const response = await fetch(`${ROOT_URL}/api/expenses`, { headers: jsonHeaders(session.token) });
      serverOk = response.ok;
    } catch {
      serverOk = false;
    }
  }
  checks.push({
    id: 'server',
    label: 'The server is reachable',
    ok: serverOk,
    hint: "Couldn't load your items from the server. Try again in a bit.",
  });

  return checks;
};

export type KeyCheckResult = 'match' | 'mismatch' | 'unverified';

/** Tries a key against the payloads on the server. 'unverified' means offline or nothing encrypted yet. */
export const checkKeyAgainstServer = async (keyText: string): Promise<KeyCheckResult> => {
  const session = getSession();
  if (!session || !navigator.onLine) return 'unverified';
  const key = await toCryptoKey(keyText);
  let response: Response;
  try {
    response = await fetch(`${ROOT_URL}/api/expenses`, { headers: jsonHeaders(session.token) });
  } catch {
    return 'unverified';
  }
  if (!response.ok) return 'unverified';
  const rows: any[] = await response.json();
  const records: ListRecord[] = rows.map((row) => ({ ...row, id: String(row.id), type: recordType(row) }));
  if (!records.some((record) => extractPayload(record))) return 'unverified';
  try {
    await assertKeyMatches(key, session.uid, records);
    return 'match';
  } catch {
    return 'mismatch';
  }
};
