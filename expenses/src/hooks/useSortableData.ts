import { useMemo, useState } from 'react';

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export const useSortableData = (
  items: any[],
  config: SortConfig | null = null
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.direction === 'ascending') {
          return a[sortConfig.key] - b[sortConfig.key];
        } else {
          return b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { sortedItems, requestSort, sortConfig };
};

export const getClassNamesFor = (
  sortConfig: SortConfig | null,
  name: string
) => (sortConfig && sortConfig.key === name ? sortConfig.direction : '');
