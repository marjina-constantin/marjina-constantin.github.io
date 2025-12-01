import React from 'react';
import { CheckCircle2, Clock3, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import './ItemSyncIndicator.scss';
import { useSyncStatus } from '../context';

interface ItemSyncIndicatorProps {
  itemId: string;
  failed?: boolean;
}

const ItemSyncIndicator: React.FC<ItemSyncIndicatorProps> = ({ itemId, failed }) => {
  const { pendingItemIds, syncedItems, isOnline, isSyncing } = useSyncStatus();

  const isPending = pendingItemIds.has(itemId);
  const isRecentlySynced = syncedItems.has(itemId);

  let icon: React.ReactNode = null;
  let modifier = '';

  if (failed) {
    icon = <AlertTriangle size={14} />;
    modifier = 'failed';
  } else if (isPending) {
    if (!isOnline) {
      icon = <WifiOff size={14} />;
      modifier = 'offline';
    } else if (isSyncing) {
      icon = <RefreshCw size={14} className="item-sync-indicator__spinner" />;
      modifier = 'syncing';
    } else {
      icon = <Clock3 size={14} />;
      modifier = 'pending';
    }
  } else if (isRecentlySynced) {
    icon = <CheckCircle2 size={14} />;
    modifier = 'success';
  }

  if (!icon) {
    return null;
  }

  return <div className={`item-sync-indicator item-sync-indicator--${modifier}`}>{icon}</div>;
};

export default ItemSyncIndicator;

