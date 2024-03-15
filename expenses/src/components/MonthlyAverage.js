import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { useSortableData, getClassNamesFor } from '../utils/useSortableData';
export default function MonthlyAverage() {
  const { data } = useData();
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.categoryTotals]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt(
    (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1
  );
  const monthsPassed = parseFloat(daysPassed / 30.42).toFixed(2);
  const monthlyAverage = parseFloat(data.totalSpent / monthsPassed).toFixed(2);
  const { sortedItems, requestSort, sortConfig } = useSortableData(
    Object.values(data.categoryTotals)
  );

  return (
    <>
      <span className="heading">Monthly average per category</span>
      <table className="daily-average">
        <thead>
          <tr>
            <th>Category</th>
            <th
              onClick={() => requestSort('y')}
              className={`sortable ${getClassNamesFor(sortConfig, 'y')}`}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, key) => (
            <tr key={key}>
              <td>{item.name}</td>
              <td>
                {formatNumber(parseFloat(item.y / monthsPassed).toFixed(2))}{' '}
                {currency} / month
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="average-spending">
        Average spending per month: {formatNumber(monthlyAverage)} {currency}
      </div>
    </>
  );
}
