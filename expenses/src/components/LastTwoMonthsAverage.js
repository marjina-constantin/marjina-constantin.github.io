import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';

export default function LastTwoMonthsAverage() {
  const { data } = useData();
  const { currency } = useAuthState();

  useEffect(() => {}, [data.raw]);

  let lastTwoMonthsTotal = 0;
  let userHasMoreThanTwoMonths = false;
  let lastProcessedItem = {};
  const twoMonthsAgo = new Date().setDate(new Date().getDate() - 60);
  for (let item of data.raw) {
    if (item.type === 'incomes') {
      continue;
    }
    const itemDate = new Date(item.dt);
    if (itemDate < twoMonthsAgo) {
      userHasMoreThanTwoMonths = true;
      break;
    }
    lastProcessedItem = item;
    lastTwoMonthsTotal = (
      parseFloat(lastTwoMonthsTotal) + parseFloat(item.sum)
    ).toFixed(2);
  }

  const timeDiff =
    new Date().getTime() - new Date(lastProcessedItem.dt).getTime();
  const daysDiff = userHasMoreThanTwoMonths
    ? 60
    : timeDiff / (1000 * 3600 * 24);

  return (
    <span>
      Average spending for the last 60 days:{' '}
      {formatNumber(
        parseFloat(lastTwoMonthsTotal / Math.ceil(daysDiff)).toFixed(2)
      )}{' '}
      {currency} / day
    </span>
  );
}
