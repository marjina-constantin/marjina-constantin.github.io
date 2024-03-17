import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';

export default function LastTwoMonthsAverage() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  useEffect(() => {}, [data.raw]);

  let lastTwoMonthsTotal: number = 0;
  let userHasMoreThanTwoMonths = false;
  let lastProcessedItem = {};
  const twoMonthsAgo = new Date().setDate(new Date().getDate() - 60);
  for (const item of data.raw) {
    if ((item as TransactionOrIncomeItem).type === 'incomes') {
      continue;
    }
    const itemDate = new Date((item as TransactionOrIncomeItem).dt);
    if (itemDate < new Date(twoMonthsAgo)) {
      userHasMoreThanTwoMonths = true;
      break;
    }
    lastProcessedItem = item as TransactionOrIncomeItem;
    lastTwoMonthsTotal = lastTwoMonthsTotal + parseFloat(item.sum);
  }

  const timeDiff =
    new Date().getTime() -
    new Date((lastProcessedItem as TransactionOrIncomeItem).dt).getTime();
  const daysDiff = userHasMoreThanTwoMonths
    ? 60
    : timeDiff / (1000 * 3600 * 24);

  return (
    <span>
      Average spending for the last 60 days:{' '}
      {formatNumber(lastTwoMonthsTotal / Math.ceil(daysDiff))} {currency} / day
    </span>
  );
}
