import { useState, useMemo } from 'react';
import { TransactionOrIncomeItem } from '../types/types';

export type SortField = 'date' | 'amount' | null;
export type SortDirection = 'asc' | 'desc';

/**
 * Shared sort logic used by both TransactionList and IncomeList.
 * Manages sort field, direction, and returns the sorted items.
 */
export function useListSort(items: TransactionOrIncomeItem[]) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.dt).getTime();
        const dateB = new Date(b.dt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortField === 'amount') {
        const amountA =
          typeof a.sum === 'string'
            ? parseFloat(a.sum)
            : parseFloat(String(a.sum));
        const amountB =
          typeof b.sum === 'string'
            ? parseFloat(b.sum)
            : parseFloat(String(b.sum));
        return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
  }, [items, sortField, sortDirection]);

  return { sortField, sortDirection, handleSort, sortedItems };
}
