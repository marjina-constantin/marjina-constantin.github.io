import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isOnline } from '../utils/syncService';

interface SyncStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncSuccess: boolean;
  syncedItems: Set<string>;
  startSyncing: () => void;
  finishSyncing: (success: boolean) => void;
  markItemSynced: (itemId: string) => void;
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
  const [isOnlineStatus, setIsOnlineStatus] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncedItems, setSyncedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSyncing = useCallback(() => {
    setIsSyncing(true);
    setSyncSuccess(false);
  }, []);

  const finishSyncing = useCallback((success: boolean) => {
    setIsSyncing(false);
    if (success) {
      setSyncSuccess(true);
      // Hide success indicator after 3 seconds
      setTimeout(() => {
        setSyncSuccess(false);
      }, 3000);
    }
  }, []);

  const markItemSynced = useCallback((itemId: string) => {
    setSyncedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      return newSet;
    });
    
    // Remove from synced items after 3 seconds
    setTimeout(() => {
      setSyncedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 3000);
  }, []);

  return (
    <SyncStatusContext.Provider
      value={{
        isOnline: isOnlineStatus,
        isSyncing,
        syncSuccess,
        syncedItems,
        startSyncing,
        finishSyncing,
        markItemSynced,
      }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}

