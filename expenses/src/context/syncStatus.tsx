import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { getOfflineQueue } from '../utils/indexedDB';
import { registerSyncCallbacks } from '../utils/syncCallbacks';

interface SyncStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncSuccess: boolean;
  syncedItems: Set<string>;
  status: 'offline' | 'pending' | 'syncing' | 'synced';
  pendingCount: number;
  pendingItemIds: Set<string>;
  startSyncing: () => void;
  finishSyncing: (success: boolean) => void;
  markItemSynced: (itemId: string) => void;
  refreshQueueState: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | undefined>(undefined);

export function useSyncStatus() {
  const context = useContext(SyncStatusContext);
  if (context === undefined) {
    throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  }
  return context;
}

interface SyncStatusProviderProps {
  children: ReactNode;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const [isOnlineStatus, setIsOnlineStatus] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncDepth, setSyncDepth] = useState(0);
  const isSyncing = syncDepth > 0;
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncedItems, setSyncedItems] = useState<Set<string>>(new Set());
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'offline' | 'pending' | 'syncing' | 'synced'>(
    isOnlineStatus ? 'synced' : 'offline'
  );
  const successTimeoutRef = useRef<number | null>(null);
  const pendingCountRef = useRef(pendingCount);
  const isSyncingRef = useRef(isSyncing);

  useEffect(() => {
    pendingCountRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineStatus(true);
      setStatus(pendingCountRef.current > 0 ? 'pending' : 'synced');
    };
    const handleOffline = () => {
      setIsOnlineStatus(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSyncing = useCallback(() => {
    setSyncDepth((depth) => depth + 1);
    setSyncSuccess(false);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setStatus('syncing');
    }
  }, []);

  const finishSyncing = useCallback((success: boolean) => {
    setSyncDepth((depth) => Math.max(0, depth - 1));
    if (success) {
      setSyncSuccess(true);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = window.setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);
    }

    setStatus(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return 'offline';
      }
      if (pendingCountRef.current > 0) {
        return success ? 'pending' : 'syncing';
      }
      return success ? 'synced' : 'pending';
    });
  }, []);

  const markItemSynced = useCallback((itemId: string) => {
    setSyncedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      return newSet;
    });

    window.setTimeout(() => {
      setSyncedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 3000);
  }, []);

  const refreshQueueState = useCallback(async () => {
    const queue = await getOfflineQueue();
    const ids = queue
      .map((operation) => operation.itemId)
      .filter((id): id is string => Boolean(id));

    setPendingCount(queue.length);
    setPendingItemIds(new Set(ids));

    setStatus(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return 'offline';
      }
      if (queue.length > 0) {
        return isSyncingRef.current ? 'syncing' : 'pending';
      }
      return isSyncingRef.current ? 'syncing' : 'synced';
    });
  }, []);

  useEffect(() => {
    refreshQueueState();
  }, [refreshQueueState]);

  useEffect(() => {
    registerSyncCallbacks({
      onSyncStart: startSyncing,
      onSyncFinish: finishSyncing,
      onItemSynced: markItemSynced,
      onQueueUpdated: refreshQueueState,
    });

    return () => {
      registerSyncCallbacks(null);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, [finishSyncing, markItemSynced, refreshQueueState, startSyncing]);

  return (
    <SyncStatusContext.Provider
      value={{
        isOnline: isOnlineStatus,
        isSyncing,
        syncSuccess,
        syncedItems,
        status,
        pendingCount,
        pendingItemIds,
        startSyncing,
        finishSyncing,
        markItemSynced,
        refreshQueueState,
      }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}

