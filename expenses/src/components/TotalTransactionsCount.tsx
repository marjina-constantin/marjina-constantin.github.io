import React from 'react';
import { useData } from '../context';
import { DataState, TransactionOrIncomeItem } from '../type/types';

export default function TotalTransactionsCount() {
  const { data } = useData() as DataState;
  
  // Count only transactions (not incomes)
  const transactionCount = data.raw
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

