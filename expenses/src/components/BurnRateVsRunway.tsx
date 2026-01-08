import React, { useMemo } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatNumber } from '../utils/utils';
import { monthNames } from '../utils/constants';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';

export default function BurnRateVsRunway() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  // Process data chronologically to calculate cumulative values
  // Always use all-time data (data.raw), not filtered data
  const chartData = useMemo(() => {
    if (!data.raw || data.raw.length === 0) {
      return { burnRateData: [], runwayData: [], categories: [] };
    }

    // Sort data by date
    const sortedData = [...data.raw].sort((a, b) => 
      new Date(a.dt).getTime() - new Date(b.dt).getTime()
    );

    if (sortedData.length === 0) {
      return { burnRateData: [], runwayData: [], categories: [] };
    }

    // Get first day for days-based calculation
    const firstDay = new Date(sortedData[0].dt);

    // Group by month
    const monthlyData: Record<string, { income: number; spending: number; lastDate: Date }> = {};
    
    sortedData.forEach((item: TransactionOrIncomeItem) => {
      const date = new Date(item.dt);
      const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, spending: 0, lastDate: date };
      }
      
      if (item.type === 'incomes') {
        monthlyData[month].income += parseFloat(item.sum || '0');
      } else if (item.type === 'transaction') {
        monthlyData[month].spending += parseFloat(item.sum || '0');
      }
      
      // Update last date in month
      if (date > monthlyData[month].lastDate) {
        monthlyData[month].lastDate = date;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const partsA = a.split(' ');
      const partsB = b.split(' ');
      const monthIndexA = monthNames.indexOf(partsA[0]);
      const monthIndexB = monthNames.indexOf(partsB[0]);
      const yearA = parseInt(partsA[1]);
      const yearB = parseInt(partsB[1]);
      
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthIndexA - monthIndexB;
    });

    // Calculate cumulative values and metrics for each month
    let cumulativeIncome = 0;
    let cumulativeSpending = 0;
    const burnRateData: number[] = [];
    const runwayData: number[] = [];
    const categories: string[] = [];

    sortedMonths.forEach((month) => {
      cumulativeIncome += monthlyData[month].income;
      cumulativeSpending += monthlyData[month].spending;

      // Calculate months passed using days-based calculation (matching MonthlyAverageTrend)
      const lastDate = monthlyData[month].lastDate;
      const daysPassed = (lastDate.getTime() - firstDay.getTime()) / 86400000 + 1;
      const monthsPassed = daysPassed / 30.42;

      // Calculate monthly burn rate (average spending per month) using days-based calculation
      const monthlyBurnRate = monthsPassed > 0 ? cumulativeSpending / monthsPassed : 0;
      
      // Calculate cumulative savings
      const cumulativeSavings = cumulativeIncome - cumulativeSpending;
      
      // Calculate runway (months you can survive)
      const runway = monthlyBurnRate > 0 ? cumulativeSavings / monthlyBurnRate : 0;

      burnRateData.push(monthlyBurnRate);
      runwayData.push(runway);
      categories.push(month);
    });

    return { burnRateData, runwayData, categories };
  }, [data.raw]);

  const burnRateVsRunwayOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Burn Rate vs Runway Evolution',
    },
    xAxis: {
      categories: chartData.categories,
      crosshair: true,
    },
    yAxis: [
      {
        title: {
          text: `Burn Rate (${currency})`,
        },
        labels: {
          format: '{value}',
        },
      },
      {
        title: {
          text: 'Runway (Months)',
        },
        labels: {
          format: '{value}',
        },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        let tooltip = `<b>${this.x}</b><br/>`;
        this.points?.forEach((point) => {
          if (point.series.name === 'Burn Rate') {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${formatNumber(point.y as number)} ${currency}</b><br/>`;
          } else {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${formatNumber(point.y as number)} months</b><br/>`;
          }
        });
        return tooltip;
      },
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: 'Burn Rate',
        data: chartData.burnRateData,
        yAxis: 0,
        color: '#f87171',
      },
      {
        name: 'Runway',
        data: chartData.runwayData,
        yAxis: 1,
        color: '#4ade80',
      },
    ],
  };

  if (!data.raw || data.raw.length === 0) {
    return null;
  }

  return (
    <>
      <HighchartsReact highcharts={Highcharts} options={burnRateVsRunwayOptions} />
      <div style={{ 
        padding: '1rem', 
        fontSize: '0.9rem', 
        color: '#a0a0a0',
        lineHeight: '1.6'
      }}>
        <p><strong>Burn Rate:</strong> Your average monthly spending over time</p>
        <p><strong>Runway:</strong> How many months you could survive on current savings if income stopped</p>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
          If your burn rate stays flat but your runway grows, you're gaining financial freedom.
        </p>
      </div>
    </>
  );
}
