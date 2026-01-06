import React, { useEffect, useState } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';

export default function LastTwoMonthsAverage() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  const [daysPeriod, setDaysPeriod] = useState<number>(60);

  useEffect(() => {}, [data.raw]);

  const cyclePeriod = () => {
    setDaysPeriod(prev => {
      if (prev === 60) return 7;
      if (prev === 7) return 14;
      if (prev === 14) return 30;
      return 60; // if 30, go back to 60
    });
  };

  let periodTotal: number = 0;
  let userHasMoreThanPeriod = false;
  let lastProcessedItem = {};
  const periodStartDate = new Date().setDate(new Date().getDate() - daysPeriod);
  
  for (const item of data.raw) {
    if ((item as TransactionOrIncomeItem).type === 'incomes') {
      continue;
    }
    const itemDate = new Date((item as TransactionOrIncomeItem).dt);
    if (itemDate < new Date(periodStartDate)) {
      userHasMoreThanPeriod = true;
      break;
    }
    lastProcessedItem = item as TransactionOrIncomeItem;
    periodTotal = periodTotal + parseFloat(item.sum);
  }

  const timeDiff =
    new Date().getTime() -
    new Date((lastProcessedItem as TransactionOrIncomeItem).dt).getTime();
  const daysDiff = userHasMoreThanPeriod
    ? daysPeriod
    : timeDiff / (1000 * 3600 * 24);

  return (
    <span
      onClick={cyclePeriod}
      style={{
        cursor: 'pointer',
      }}
    >
      Average spending for the last {daysPeriod} days:{' '}
      {formatNumber(periodTotal / Math.ceil(daysDiff))} {currency} / day
    </span>
  );
}
