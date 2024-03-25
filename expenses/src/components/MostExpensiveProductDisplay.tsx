import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';
import { formatNumber, getCategory } from '../utils/utils';

export default function MostExpensiveProductDisplay() {
  // All time section
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  const items = data.filtered_raw || data.raw;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data, currency]);

  let maxSum = -Infinity;
  let transactionWithMaxSum: TransactionOrIncomeItem | undefined = undefined;

  for (const transaction of items) {
    if (transaction.type !== 'transaction') continue;
    const sum = parseFloat(transaction.sum);
    if (sum > maxSum) {
      maxSum = sum;
      transactionWithMaxSum = transaction;
    }
  }

  if (!transactionWithMaxSum) {
    return null;
  }

  return (
    <>
      <span className="heading">The most expensive item</span>
      <div className="table-wrapper">
        <table className="expenses-table" cellSpacing="0" cellPadding="0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{transactionWithMaxSum?.dt}</td>
              <td>
                {formatNumber(transactionWithMaxSum?.sum)} {currency}
              </td>
              <td>{getCategory[transactionWithMaxSum?.cat]}</td>
              <td>{transactionWithMaxSum?.dsc}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
