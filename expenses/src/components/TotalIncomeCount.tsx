import React from 'react';
import { useData } from '../context';
import { DataState, TransactionOrIncomeItem } from '../type/types';

export default function TotalIncomeCount() {
  const { data } = useData() as DataState;
  
  // Use filtered data if filters are active, otherwise use all income data
  const incomeCount = data?.filteredIncomeData !== null
    ? (data?.filteredIncomeData || []).length
    : (data.raw
        ? data.raw.filter((item: TransactionOrIncomeItem) => item.type === 'incomes').length
        : 0);

  return (
    <div className="total-income-count" style={{ 
      padding: '0.5rem 1rem', 
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#a0a0a0',
      fontWeight: '400'
    }}>
      {incomeCount.toLocaleString()} incomes
    </div>
  );
}

