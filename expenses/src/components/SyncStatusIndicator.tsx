import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '../context/syncStatus';
import { useData } from '../context';
import { DataState } from '../type/types';
import './SyncStatusIndicator.scss';

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, syncSuccess, pendingCount } = useSyncStatus();
  const { data } = useData() as DataState;
  const failedCount =
    data?.raw?.filter((item) => item.failed).length || 0;

  let icon: React.ReactNode;
  let label = '';
  let modifier = '';

  if (!isOnline) {
    icon = <WifiOff size={16} />;
    label = pendingCount > 0 ? `${pendingCount} pending • Offline` : 'Offline';
    modifier = 'offline';
  } else if (failedCount > 0) {
    icon = <AlertTriangle size={16} />;
    label = `Failed to sync ${failedCount} item${failedCount === 1 ? '' : 's'}`;
    modifier = 'error';
  } else if (isSyncing) {
    icon = <RefreshCw size={16} className="sync-status-indicator__icon--spinning" />;
    label =
      pendingCount > 0
        ? `Syncing ${pendingCount} item${pendingCount === 1 ? '' : 's'}`
        : 'Syncing...';
    modifier = 'syncing';
  } else if (pendingCount > 0) {
    icon = <Clock3 size={16} />;
    label = `${pendingCount} item${pendingCount === 1 ? '' : 's'} pending`;
    modifier = 'pending';
  } else if (syncSuccess) {
    icon = <CheckCircle2 size={16} />;
    label = 'Synced';
    modifier = 'success';
  } else {
    icon = <CheckCircle2 size={16} />;
    modifier = 'idle';
  }

  return (
    <div className={`sync-status-indicator sync-status-indicator--${modifier}`}>
      {icon}
      {label && <span>{label}</span>}
    </div>
  );
};

export default SyncStatusIndicator;

