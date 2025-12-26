import React, { useState } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatDataForChart, formatNumber } from '../utils/utils';
import { monthNames } from '../utils/constants';
import { AuthState, DataState } from '../type/types';

export default function YearIncomeAverageTrend() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  const [clickedCells, setClickedCells] = useState<Set<string>>(new Set());

  const totalIncomePerYear = data?.totalIncomePerYear || {};
  const totalPerYear = data?.totalPerYear || {};
  const totalSpent = data?.totalSpent || 0;

  const formattedIncomeData = formatDataForChart(
    data?.totalIncomePerYearAndMonth || {}
  );

  const yearIncomeAverageOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Years in review',
    },
    xAxis: {
      type: 'category',
      categories: monthNames,
      crosshair: true,
    },
    yAxis: {
      title: {
        text: currency,
      },
    },
    tooltip: {
      shared: true,
      split: true,
    },
    credits: {
      enabled: false,
    },
    series: formattedIncomeData,
  };

  let sumDiff: number = 0;
  let sumIncome: number = 0;
  
  // Sort years to calculate percentage changes correctly
  const sortedYears = Object.keys(totalIncomePerYear).sort((a, b) => 
    parseInt(a) - parseInt(b)
  );
  
  const calculatePercentageChange = (current: number, previous: number): number | null => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  
  const formatPercentageChange = (percent: number | null, isSpent: boolean = false): React.ReactNode => {
    if (percent === null) return null;
    const sign = percent >= 0 ? '+' : '';
    // For Spent column: positive % (spent more) = RED, negative % (spent less) = GREEN
    // For Income column: positive % (earned more) = GREEN, negative % (earned less) = RED
    let color: string;
    if (isSpent) {
      color = percent >= 0 ? '#f87171' : '#4ade80'; // Inverted for spent
    } else {
      color = percent >= 0 ? '#4ade80' : '#f87171'; // Normal for income
    }
    return <span style={{ color }}> ({sign}{formatNumber(percent)}%)</span>;
  };
  
  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={yearIncomeAverageOptions}
      />
      <span className="heading">Total income per year:</span>
      <div className="table-wrapper">
        <table className="expenses-table" cellSpacing="0" cellPadding="0">
          <thead>
            <tr>
              <th>Year</th>
              <th>Income</th>
              <th>Spent</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map((year, key) => {
              const currentIncome = totalIncomePerYear[year] as number;
              const currentSpent = (totalPerYear[year] as number) || 0;
              const diff: number = currentIncome - currentSpent;
              const savingsPercent =
                (currentSpent / currentIncome - 1) * -100;
              
              // Get previous year's values for percentage calculation
              const prevYearIndex = key - 1;
              const prevYear = prevYearIndex >= 0 ? sortedYears[prevYearIndex] : null;
              const prevIncome = prevYear ? (totalIncomePerYear[prevYear] as number) : null;
              const prevSpent = prevYear ? ((totalPerYear[prevYear] as number) || 0) : null;
              
              const incomeChange = prevIncome !== null ? calculatePercentageChange(currentIncome, prevIncome) : null;
              const spentChange = prevSpent !== null ? calculatePercentageChange(currentSpent, prevSpent) : null;
              
              sumDiff += diff;
              sumIncome += parseFloat(currentIncome as string);
              
              const incomeCellId = `income-${year}`;
              const spentCellId = `spent-${year}`;
              const showIncomeChange = clickedCells.has(incomeCellId);
              const showSpentChange = clickedCells.has(spentCellId);
              
              const toggleCell = (cellId: string) => {
                setClickedCells(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(cellId)) {
                    newSet.delete(cellId);
                  } else {
                    newSet.add(cellId);
                  }
                  return newSet;
                });
              };
              
              return (
                <tr key={key}>
                  <td>{year}</td>
                  <td>
                    <span
                      onClick={() => toggleCell(incomeCellId)}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {formatNumber(currentIncome)} {currency}
                    </span>
                    {showIncomeChange && formatPercentageChange(incomeChange, false)}
                  </td>
                  <td>
                    <span
                      onClick={() => toggleCell(spentCellId)}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {formatNumber(currentSpent)} {currency}
                    </span>
                    {showSpentChange && formatPercentageChange(spentChange, true)}
                  </td>
                  <td>
                    {isFinite(savingsPercent)
                      ? `${formatNumber(diff)} ${currency} (${formatNumber(savingsPercent)}%)`
                      : `${formatNumber(diff)} ${currency}`}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>Total</td>
              <td>
                {formatNumber(sumIncome)} {currency}
              </td>
              <td>
                {formatNumber(totalSpent)} {currency}
              </td>
              <td>
                {formatNumber(sumDiff)} {currency} (
                {formatNumber((totalSpent / sumIncome - 1) * -100)}
                %)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
