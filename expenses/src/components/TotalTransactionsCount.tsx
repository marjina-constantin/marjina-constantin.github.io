import React from 'react';
import { useData } from '../context';
import { DataState, TransactionOrIncomeItem } from '../type/types';

export default function TotalTransactionsCount() {
  const { data } = useData() as DataState;
  
  // Use filtered data if filters are applied, otherwise use raw data
  // filtered_raw already contains only transactions, so use length directly
  // For raw data, we need to filter to exclude incomes
  const transactionCount = data.filtered_raw
    ? data.filtered_raw.length
    : data.raw
    ? data.raw.filter((item: TransactionOrIncomeItem) => item.type === 'transaction').length
    : 0;

  return (
    <div className="total-transactions-count" style={{ 
      padding: '0.5rem 1rem', 
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#a0a0a0',
      fontWeight: '400'
    }}>
      {transactionCount.toLocaleString()} transactions
    </div>
  );
}

