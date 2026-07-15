import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Edit, Trash2, Wallet, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, getCategory } from '../../utils/utils';
import { getCategoryIcon, getCategoryTint } from '../../utils/categoryIcons';
import { TransactionOrIncomeItem } from '../../types/types';
import StatCard from '../ui/StatCard';
import SortControls from '../ui/SortControls';
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
  const [categoryTipId, setCategoryTipId] = useState<string | null>(null);
  const tipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd, deleteVisible, editVisible, swipedItemId } = useSwipeActions();

  const allItems = useListItems(transactions, changedItems, handleClearChangedItem, 'transaction');
  const { sortField, sortDirection, handleSort, sortedItems } = useListSort(allItems);

  useEffect(() => {
    return () => {
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
    };
  }, []);

  const getCategoryLabel = (catValue: string | undefined) => {
    if (!catValue) return '';
    const category = categoryLabels.find((cat) => cat.value === catValue);
    return category?.label || getCategory[catValue] || '';
  };

  const showCategoryTip = useCallback((id: string) => {
    if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
    setCategoryTipId(id);
    tipTimeoutRef.current = setTimeout(() => setCategoryTipId(null), 1400);
  }, []);

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
          const CategoryIcon = getCategoryIcon(transaction.cat);
          const categoryTint = getCategoryTint(transaction.cat);
          const date = new Date(transaction.dt);
          const day = date.getDate();
          const monthAbbr = monthNames[date.getMonth()].substring(0, 3).toUpperCase();
          const isThisItemSwiped = swipedItemId === transaction.id;
          const tipVisible = categoryTipId === transaction.id;

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
                {/* Category Icon */}
                <button
                  type="button"
                  className="transaction-category-box"
                  style={{ '--category-tint': categoryTint } as React.CSSProperties}
                  title={categoryLabel}
                  aria-label={categoryLabel || 'Category'}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (categoryLabel) showCategoryTip(transaction.id);
                  }}
                >
                  <CategoryIcon className="category-icon" size={18} strokeWidth={1.75} aria-hidden />
                  {tipVisible && (
                    <span className="transaction-category-tip" role="status">
                      {categoryLabel}
                    </span>
                  )}
                </button>
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
