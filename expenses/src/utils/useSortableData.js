import { useMemo, useState } from "react";

export const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.direction === "ascending") {
          return a[sortConfig.key] - b[sortConfig.key];
        } else {
          return b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return { sortedItems: sortedItems, requestSort, sortConfig };
};

export const getClassNamesFor = (sortConfig, name) =>
  sortConfig && sortConfig.key === name ? sortConfig.direction : "";
