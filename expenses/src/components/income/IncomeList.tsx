import React, { useRef } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/utils';
import { TransactionOrIncomeItem } from '../../types/types';
import { monthNames } from '../../utils/constants';
import SortControls from '../ui/SortControls';
import useSwipeActions from '../../hooks/useSwipeActions';
import { useListSort } from '../../hooks/useListSort';
import { useListItems } from '../../hooks/useListItems';
import ItemSyncIndicator from '../sync/ItemSyncIndicator';
import HashtagText from '../ui/HashtagText';

interface IncomeListProps {
  transactions: TransactionOrIncomeItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  changedItems?: any;
  handleClearChangedItem?: any;
}

const IncomeList: React.FC<IncomeListProps> = ({
  transactions,
  onEdit,
  onDelete,
  changedItems = {},
  handleClearChangedItem,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd, deleteVisible, editVisible, swipedItemId } = useSwipeActions();

  const allItems = useListItems(transactions, changedItems, handleClearChangedItem, 'incomes');
  const { sortField, sortDirection, handleSort, sortedItems } = useListSort(allItems);

  return (
    <div className="transaction-list-component income-list" ref={listRef}>
      <SortControls
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {sortedItems.map((transaction) => {
        const changeType = changedItems[transaction.id]?.type;
        const date = new Date(transaction.dt);
        const day = date.getDate();
        const monthAbbr = monthNames[date.getMonth()].substring(0, 3).toUpperCase();
        const year = date.getFullYear();
        const isThisItemSwiped = swipedItemId === transaction.id;

        return (
          <div key={transaction.id} className={`transaction-item-wrapper ${changeType || ''}`}>
            {/* Swipe Actions */}
            <div
              className={`swipe-actions-background ${
                isThisItemSwiped && (deleteVisible || editVisible) ? 'visible' : ''
              }`}
            >
              {isThisItemSwiped && deleteVisible && (
                <div className="delete-action-bg">
                  <Trash2 />
                </div>
              )}
              {isThisItemSwiped && editVisible && (
                <div className="edit-action-bg">
                  <Edit />
                </div>
              )}
            </div>
            <div
              data-id={transaction.id}
              className="transaction-list-item"
              onTouchStart={(e) => handleTouchStart(e, transaction.id, listRef)}
              onTouchMove={(e) => handleTouchMove(e, listRef)}
              onTouchEnd={(e) => handleTouchEnd(e, listRef, transaction.id, onEdit, onDelete)}
            >
              {/* Date */}
              <div className="transaction-date-box">
                <div className="date-day">{day}</div>
                <div className="date-month">{monthAbbr}</div>
                <div className="date-year">{year}</div>
              </div>
              {/* Content */}
              <div className="transaction-content">
                <div className="transaction-name">
                  <HashtagText text={transaction.dsc || ''} />
                  <ItemSyncIndicator itemId={transaction.id} failed={transaction.failed} />
                </div>
              </div>
              {/* Price */}
              <div className="transaction-price">{formatNumber(transaction.sum)}</div>
              {/* Desktop Action Buttons */}
              <div className="transaction-actions-desktop">
                <button
                  className="transaction-action-btn transaction-action-btn--edit"
                  onClick={() => onEdit(transaction.id)}
                  aria-label="Edit income"
                >
                  <Edit size={18} />
                </button>
                <button
                  className="transaction-action-btn transaction-action-btn--delete"
                  onClick={() => onDelete(transaction.id)}
                  aria-label="Delete income"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(IncomeList);
