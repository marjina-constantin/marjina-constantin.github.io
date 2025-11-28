import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import './ItemSyncIndicator.scss';

interface ItemSyncIndicatorProps {
  show: boolean;
}

const ItemSyncIndicator: React.FC<ItemSyncIndicatorProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="item-sync-indicator">
      <CheckCircle2 size={14} />
    </div>
  );
};

export default ItemSyncIndicator;

