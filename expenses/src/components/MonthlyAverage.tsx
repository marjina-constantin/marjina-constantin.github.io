import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { getClassNamesFor, useSortableData } from '../utils/useSortableData';
import { AuthState, DataState } from '../type/types';
export default function MonthlyAverage() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.categoryTotals]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed: number =
    (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1;
  const monthsPassed: number = daysPassed / 30.42;
  const monthlyAverage: number = data.totalSpent / monthsPassed;
  const { sortedItems, requestSort, sortConfig } = useSortableData(
    Object.values(data.categoryTotals || [])
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
                {formatNumber(item.y / monthsPassed)} {currency} / month
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
