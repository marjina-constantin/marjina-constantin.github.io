import { useEffect, useMemo } from 'react';
import { TransactionOrIncomeItem } from '../types/types';

/**
 * Merges live transactions with recently-removed items (for animation),
 * sorts them by date, and auto-clears changed items after 2 seconds.
 *
 * Used by both TransactionList and IncomeList — the only difference
 * is the `itemType` filter ('transaction' | 'incomes').
 */
export function useListItems(
  transactions: TransactionOrIncomeItem[],
  changedItems: Record<string, any>,
  handleClearChangedItem: ((id: string) => void) | undefined,
  itemType: 'transaction' | 'incomes'
) {
  // Auto-clear changed items after 2s for removal animation
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

  // Merge live items with recently-removed items, sorted newest-first
  const allItems = useMemo(() => {
    return [
      ...transactions,
      ...Object.values(changedItems)
        .filter(
          (item: any) =>
            item.type === 'removed' && item.data.type === itemType
        )
        .map((item: any) => item.data),
    ].sort((a, b) => {
      const dateComparison =
        new Date(b.dt).getTime() - new Date(a.dt).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return (b.cr || 0) - (a.cr || 0);
    });
  }, [transactions, changedItems, itemType]);

  return allItems;
}
