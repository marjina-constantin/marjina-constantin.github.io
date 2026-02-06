import React, { useRef, useMemo } from 'react';
import { Edit, Trash2, Wallet, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, getCategory } from '../../utils/utils';
import { TransactionOrIncomeItem } from '../../types/types';
import StatCard from '../ui/StatCard';
import SortControls from '../ui/SortControls';
import { useData } from '../../context';
import { DataState } from '../../types/types';
import { monthNames } from '../../utils/constants';
import useSwipeActions from '../../hooks/useSwipeActions';
import { useListSort } from '../../hooks/useListSort';
import { useListItems } from '../../hooks/useListItems';
import ItemSyncIndicator from '../sync/ItemSyncIndicator';
import HashtagText from '../ui/HashtagText';

interface TransactionListProps {
  transactions: TransactionOrIncomeItem[];
  categoryLabels: Array<{ value: string; label: string }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  changedItems?: any;
  handleClearChangedItem?: any;
  month?: string;
  total?: number;
  incomeTotals?: { [month: string]: number };
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categoryLabels,
  onEdit,
  onDelete,
  changedItems = {},
  handleClearChangedItem,
  month,
  total,
  incomeTotals,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const { data } = useData() as DataState;

  const { handleTouchStart, handleTouchMove, handleTouchEnd, deleteVisible, editVisible, swipedItemId } = useSwipeActions();

  const allItems = useListItems(transactions, changedItems, handleClearChangedItem, 'transaction');
  const { sortField, sortDirection, handleSort, sortedItems } = useListSort(allItems);

  const getCategoryLabel = (catValue: string | undefined) => {
    if (!catValue) return '';
    const category = categoryLabels.find((cat) => cat.value === catValue);
    return category?.label || getCategory[catValue] || '';
  };

  const income = useMemo(
    () => (incomeTotals && month ? incomeTotals[month] : -1),
    [incomeTotals, month]
  );
  const profit = useMemo(
    () => (income > 0 && total ? parseFloat((income - total).toFixed(2)) : 0),
    [income, total]
  );

  return (
    <>
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<Wallet />}
          value={total || 0}
          label="Spent"
        />
        {income > 0 && (
          <StatCard
            icon={<ArrowUpCircle />}
            value={income}
            label="Income"
          />
        )}
        {income > 0 && (
          <StatCard
            icon={profit >= 0 ? <TrendingUp /> : <TrendingDown />}
            value={profit}
            label="Profit"
          />
        )}
      </div>

      {/* Transaction List */}
      <div className="transaction-list-component" ref={listRef}>
        <SortControls
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {sortedItems.map((transaction) => {
          const changeType = changedItems[transaction.id]?.type;
          const categoryLabel = getCategoryLabel(transaction.cat);
          const date = new Date(transaction.dt);
          const day = date.getDate();
          const monthAbbr = monthNames[date.getMonth()].substring(0, 3).toUpperCase();
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
                    <Trash2 size={22} strokeWidth={2.5} />
                  </div>
                )}
                {isThisItemSwiped && editVisible && (
                  <div className="edit-action-bg">
                    <Edit size={22} strokeWidth={2.5} />
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
                </div>
                {/* Category Name */}
                <div className="transaction-category-box">
                  <div className="category-name">{categoryLabel}</div>
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
                    aria-label="Edit transaction"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="transaction-action-btn transaction-action-btn--delete"
                    onClick={() => onDelete(transaction.id)}
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default React.memo(TransactionList);
