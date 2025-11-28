import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSyncStatus } from '../context/syncStatus';
import './SyncStatusIndicator.scss';

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, syncSuccess } = useSyncStatus();

  if (!isOnline) {
    return (
      <div className="sync-status-indicator sync-status-indicator--offline">
        <WifiOff size={16} />
        <span>Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="sync-status-indicator sync-status-indicator--syncing">
        <RefreshCw size={16} className="sync-status-indicator__icon--spinning" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (syncSuccess) {
    return (
      <div className="sync-status-indicator sync-status-indicator--success">
        <CheckCircle2 size={16} />
        <span>Synced</span>
      </div>
    );
  }

  return null;
};

export default SyncStatusIndicator;

