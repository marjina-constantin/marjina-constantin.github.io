import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Edit, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Wallet, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, getCategory } from '../utils/utils';
import { TransactionOrIncomeItem } from '../type/types';
import StatCard from './StatCard';
import { useAuthState, useData } from '../context';
import { AuthState, DataState } from '../type/types';
import { monthNames } from '../utils/constants';
import useSwipeActions from '../hooks/useSwipeActions';
import ItemSyncIndicator from './ItemSyncIndicator';
import './TransactionList.scss';

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

type SortField = 'date' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { data } = useData() as DataState;

  const { handleTouchStart, handleTouchMove, handleTouchEnd, deleteVisible, editVisible, swipedItemId } = useSwipeActions();

  useEffect(() => {
    if (handleClearChangedItem) {
      Object.keys(changedItems).forEach((id) => {
        const timer = setTimeout(() => {
          handleClearChangedItem(id);
        }, 2000);
        return () => clearTimeout(timer);
      });
    }
  }, [changedItems, handleClearChangedItem]);

  const allItems = useMemo(() => {
    return [
      ...transactions,
      ...Object.values(changedItems)
        .filter((item: any) => item.type === 'removed' && item.data.type === 'transaction')
        .map((item: any) => item.data),
    ].sort((a, b) => {
      const dateComparison = new Date(b.dt).getTime() - new Date(a.dt).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return (b.cr || 0) - (a.cr || 0);
    });
  }, [transactions, changedItems]);

  const getCategoryLabel = (catValue: string | undefined) => {
    if (!catValue) return '';
    const category = categoryLabels.find((cat) => cat.value === catValue);
    return category?.label || getCategory[catValue] || '';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!sortField) return allItems;
    
    return [...allItems].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.dt).getTime();
        const dateB = new Date(b.dt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortField === 'amount') {
        const amountA = typeof a.sum === 'string' ? parseFloat(a.sum) : parseFloat(String(a.sum));
        const amountB = typeof b.sum === 'string' ? parseFloat(b.sum) : parseFloat(String(b.sum));
        return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
  }, [allItems, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
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
        {/* Sort Controls */}
        <div className="sort-controls">
          <button
            className={`sort-button ${sortField === 'date' ? 'active' : ''}`}
            onClick={() => handleSort('date')}
          >
            Date {getSortIcon('date')}
          </button>
          <button
            className={`sort-button ${sortField === 'amount' ? 'active' : ''}`}
            onClick={() => handleSort('amount')}
          >
            Amount {getSortIcon('amount')}
          </button>
        </div>

        {sortedTransactions.map((transaction) => {
          const changeType = changedItems[transaction.id]?.type;
          const categoryLabel = getCategoryLabel(transaction.cat);
          const date = new Date(transaction.dt);
          const day = date.getDate();
          const month = monthNames[date.getMonth()].substring(0, 3).toUpperCase();
          const isThisItemSwiped = swipedItemId === transaction.id;

          return (
            <div key={transaction.id} className={`transaction-item-wrapper ${changeType || ''}`}>
              {/* Swipe Actions - only show for the swiped item */}
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
                  <div className="date-month">{month}</div>
                </div>
                {/* Category Name */}
                <div className="transaction-category-box">
                  <div className="category-name">{categoryLabel}</div>
                </div>
                {/* Content */}
                <div className="transaction-content">
                  <div className="transaction-name">
                    {transaction.dsc}
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
