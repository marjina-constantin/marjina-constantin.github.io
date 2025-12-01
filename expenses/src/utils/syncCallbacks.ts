export interface SyncCallbacks {
  onSyncStart?: () => void;
  onSyncFinish?: (success: boolean) => void;
  onItemSynced?: (itemId: string) => void;
  onQueueUpdated?: () => void;
}

let callbacks: SyncCallbacks | null = null;

export function registerSyncCallbacks(nextCallbacks: SyncCallbacks | null) {
  callbacks = nextCallbacks;
}

export function notifySyncStart() {
  callbacks?.onSyncStart?.();
}

export function notifySyncFinish(success: boolean) {
  callbacks?.onSyncFinish?.(success);
}

export function notifyItemSynced(itemId: string) {
  callbacks?.onItemSynced?.(itemId);
}

export function notifyQueueUpdated() {
  callbacks?.onQueueUpdated?.();
}


