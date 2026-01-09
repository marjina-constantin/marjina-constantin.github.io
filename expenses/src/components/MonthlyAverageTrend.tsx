import React, { useEffect } from 'react';
import { useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TransactionOrIncomeItem, DataState } from '../type/types';

export default function MonthlyAverageTrend() {
  const { data } = useData() as DataState;
  const items = data.filtered_raw || data.raw;
  const hasFilters = !!data.filtered_raw;

  useEffect(() => {}, [data.raw, data.filtered_raw]);

  // Helper function to format month as "January 2024".
  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const firstDay = new Date(data.raw[data.raw.length - 1]?.dt);
  let monthlyExpenses = [];
  let totalExpensesAtDate = 0;
  let prevMonth = formatMonth(firstDay);
  let prevItemDate = firstDay;
  const dataInChronologicalOrder = items.slice().reverse();

  for (const item of dataInChronologicalOrder) {
    const itemDate = new Date(item.dt);
    const currentMonth = formatMonth(itemDate);
    if (currentMonth != prevMonth) {
      const daysPassed: number = (prevItemDate.getTime() - firstDay.getTime()) / 86400000 + 1;
      const monthsPassed: number = daysPassed / 30.42;
      monthlyExpenses[prevMonth] = [
        prevMonth,
        parseFloat(
            parseFloat(
                String(totalExpensesAtDate / monthsPassed)
            ).toFixed(2)
        ),
      ];
    }

    if ((item as TransactionOrIncomeItem).type === 'transaction') {
      totalExpensesAtDate += parseFloat(item.sum);
    }

    prevMonth = currentMonth;
    prevItemDate = itemDate;
  }

  monthlyExpenses = Object.values(monthlyExpenses);

  // Calculate months remaining (only when no filters, using all data)
  let monthsRemainingData: number[] = [];
  
  if (!hasFilters && data.raw && data.raw.length > 0) {
    // Use original pattern for months remaining calculation
    const firstDayRemaining = new Date(data.raw[data.raw.length - 1]?.dt);
    let totalIncomeAtDate = 0;
    let totalSpendingAtDate = 0;
    let prevMonthRemaining = formatMonth(firstDayRemaining);
    let prevItemDateRemaining = firstDayRemaining;
    const dataInChronologicalOrderRemaining = data.raw.slice().reverse();
    let monthlyRemaining: Record<string, number> = {};

    for (const item of dataInChronologicalOrderRemaining) {
      const itemDate = new Date(item.dt);
      const currentMonth = formatMonth(itemDate);
      
      if (currentMonth != prevMonthRemaining) {
        const daysPassed: number = (prevItemDateRemaining.getTime() - firstDayRemaining.getTime()) / 86400000 + 1;
        const monthsPassed: number = daysPassed / 30.42;
        const monthlyAverageRemaining = monthsPassed > 0 ? totalSpendingAtDate / monthsPassed : 0;
        const cumulativeSavings = totalIncomeAtDate - totalSpendingAtDate;
        const monthsRemaining = monthlyAverageRemaining > 0 ? cumulativeSavings / monthlyAverageRemaining : 0;
        
        monthlyRemaining[prevMonthRemaining] = parseFloat(
          parseFloat(String(monthsRemaining)).toFixed(2)
        );
      }

      if ((item as TransactionOrIncomeItem).type === 'incomes') {
        totalIncomeAtDate += parseFloat(item.sum || '0');
      } else if ((item as TransactionOrIncomeItem).type === 'transaction') {
        totalSpendingAtDate += parseFloat(item.sum || '0');
      }

      prevMonthRemaining = currentMonth;
      prevItemDateRemaining = itemDate;
    }

    // Extract data in same order as monthlyExpenses
    monthsRemainingData = monthlyExpenses.map(([month]) => monthlyRemaining[month as string] || 0);
  }

  const series = [
    {
      name: 'Monthly average expenses',
      data: monthlyExpenses,
    },
  ];

  // Add months remaining series only when no filters
  if (!hasFilters && monthsRemainingData.length > 0) {
    series.push({
      name: 'Months Remaining',
      data: monthsRemainingData,
      yAxis: 1,
      visible: false,
    });
  }

  const monthlyAverageOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Monthly Average Trends',
    },
    colors: ['#E91E63', '#4DD0E1'],
    yAxis: [
      {
        title: {
          text: 'Monthly average',
        },
      },
      // Only show second Y-axis when no filters are applied
      ...(hasFilters ? [] : [{
        title: {
          text: 'Months Remaining',
        },
        opposite: true,
      }]),
    ],
    xAxis: {
      type: 'category',
      categories: monthlyExpenses.map(([month]) => month),
      crosshair: true,
    },
    tooltip: {
      xDateFormat: '%B %Y',
      shared: true,
      split: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        // With explicit categories set, this.x should be the category name string
        const category = typeof this.x === 'string' ? this.x : String(this.x);
        let tooltip = `<b>${category}</b><br/>`;
        this.points?.forEach((point) => {
          if (point.series.name === 'Monthly average expenses') {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y}</b><br/>`;
          } else {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y} months</b><br/>`;
          }
        });
        return tooltip;
      },
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return (
    <>
      <HighchartsReact highcharts={Highcharts} options={monthlyAverageOptions} />
      {!hasFilters && (
        <div style={{ 
          padding: '1rem', 
          fontSize: '0.9rem', 
          color: '#a0a0a0',
          lineHeight: '1.6'
        }}>
          <p><strong>Months Remaining:</strong> How many months you could survive on current savings if income stopped</p>
          <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
            If your monthly average stays flat but your months remaining grow, you're gaining financial freedom.
          </p>
        </div>
      )}
    </>
  );
}
