import React, { useMemo, useState } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatNumber } from '../utils/utils';
import { monthNames } from '../utils/constants';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';
import { hasTag } from '../utils/utils';

export default function WealthVelocity() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  const [userExpectedReturn, setUserExpectedReturn] = useState<number | null>(null);

  // Process data to calculate monthly investment income and expenses
  const chartData = useMemo(() => {
    if (!data.raw || data.raw.length === 0) {
      return { 
        historicalInterest: [],
        historicalExpenses: [],
        projectedInterest: [],
        projectedExpenses: [],
        categories: [],
        historicalCategories: [],
        projectedCategories: [],
        fiPercentage: 0,
        crossoverPoint: null,
        currentYield: 0,
        averageMonthlySavings: 0,
        currentAssets: 0
      };
    }

    // Sort data by date
    const sortedData = [...data.raw].sort((a, b) => 
      new Date(a.dt).getTime() - new Date(b.dt).getTime()
    );

    // Group by month
    const monthlyData: Record<string, { 
      interestIncome: number; 
      expenses: number;
      totalIncome: number;
    }> = {};
    
    sortedData.forEach((item: TransactionOrIncomeItem) => {
      const date = new Date(item.dt);
      const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { interestIncome: 0, expenses: 0, totalIncome: 0 };
      }
      
      if (item.type === 'incomes') {
        monthlyData[month].totalIncome += parseFloat(item.sum || '0');
        // Check if income has #interest tag
        if (item.dsc && hasTag(item.dsc, 'interest')) {
          monthlyData[month].interestIncome += parseFloat(item.sum || '0');
        }
      } else if (item.type === 'transaction') {
        monthlyData[month].expenses += parseFloat(item.sum || '0');
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

    // Get last 12 months for historical data
    const last12Months = sortedMonths.slice(-12);
    
    // Historical data: actual interest income
    const historicalInterest: number[] = [];
    const historicalExpenses: number[] = [];
    const historicalCategories: string[] = [];
    
    // Calculate 3-month rolling average for expenses
    const expensesWithRollingAvg: number[] = [];
    
    last12Months.forEach((month, index) => {
      const rawExpenses = monthlyData[month].expenses;
      const interestIncome = monthlyData[month].interestIncome || 0;
      
      historicalInterest.push(interestIncome);
      historicalCategories.push(month);
      
      // Calculate 3-month rolling average
      if (index < 2) {
        // First two months: use actual expenses
        expensesWithRollingAvg.push(rawExpenses);
      } else {
        // 3-month rolling average
        const avg = (
          monthlyData[last12Months[index - 2]].expenses +
          monthlyData[last12Months[index - 1]].expenses +
          rawExpenses
        ) / 3;
        expensesWithRollingAvg.push(avg);
      }
    });
    
    historicalExpenses.push(...expensesWithRollingAvg);

    // Calculate average monthly savings (Income - Expenses) from last 6 months
    const last6Months = sortedMonths.slice(-6);
    const monthlySavings: number[] = [];
    last6Months.forEach(month => {
      const savings = monthlyData[month].totalIncome - monthlyData[month].expenses;
      monthlySavings.push(savings);
    });
    const averageMonthlySavings = monthlySavings.length > 0 
      ? monthlySavings.reduce((a, b) => a + b, 0) / monthlySavings.length 
      : 0;
    
    // Calculate current yield from last 12 months of interest income (better accuracy with more data)
    const last12MonthsInterest = last12Months.map(m => monthlyData[m].interestIncome || 0);
    const avgLast12MonthsInterest = last12MonthsInterest.reduce((a, b) => a + b, 0) / last12MonthsInterest.length;
    
    // Calculate average of last 6 months interest for asset estimation
    const last6MonthsInterest = last6Months.map(m => monthlyData[m].interestIncome || 0);
    const avgLast6MonthsInterest = last6MonthsInterest.reduce((a, b) => a + b, 0) / 6;
    
    // Calculate current yield: Use average of last 3 months interest, annualized
    // We need to estimate assets to calculate yield properly
    // Strategy: Use a default yield to estimate assets, then we can refine
    const defaultYield = 0.05; // 5% annual default
    const defaultMonthlyYield = defaultYield / 12;
    
    // Estimate current assets from average interest income
    // Assets = Average Monthly Interest / Monthly Yield
    let estimatedAssets = 0;
    if (avgLast6MonthsInterest > 0) {
      estimatedAssets = avgLast6MonthsInterest / defaultMonthlyYield;
    }
    
    // Calculate actual yield from estimated assets
    // If we have assets and interest, yield = (Monthly Interest / Assets) * 12
    let currentYield = defaultYield;
    if (estimatedAssets > 0 && avgLast12MonthsInterest > 0) {
      const monthlyYieldFromData = avgLast12MonthsInterest / estimatedAssets;
      currentYield = monthlyYieldFromData * 12; // Annualize
    }
    
    // Use user input if provided, otherwise use calculated yield
    const effectiveYield = userExpectedReturn !== null ? userExpectedReturn : currentYield;
    const monthlyYield = effectiveYield / 12;
    
    // Recalculate assets with the effective yield
    let currentAssets = estimatedAssets;
    if (avgLast6MonthsInterest > 0 && monthlyYield > 0) {
      currentAssets = avgLast6MonthsInterest / monthlyYield;
    }
    
    // Project forward 5 years (60 months)
    const projectedInterest: number[] = [];
    const projectedExpenses: number[] = [];
    const projectedCategories: string[] = [];
    let projectedAssets = currentAssets;
    let crossoverPoint: string | null = null;
    
    // Get last month's expenses for projection baseline
    const lastMonthExpenses = historicalExpenses.length > 0 
      ? historicalExpenses[historicalExpenses.length - 1] 
      : 0;
    
    // Generate next 60 months (5 years)
    const lastMonth = last12Months.length > 0 ? last12Months[last12Months.length - 1] : sortedMonths[sortedMonths.length - 1];
    const lastMonthParts = lastMonth.split(' ');
    let currentMonthIndex = monthNames.indexOf(lastMonthParts[0]);
    let currentYear = parseInt(lastMonthParts[1]);
    
    let projectedExpenseBase = lastMonthExpenses;
    
    for (let i = 1; i <= 60; i++) {
      currentMonthIndex++;
      if (currentMonthIndex >= 12) {
        currentMonthIndex = 0;
        currentYear++;
      }
      const projectedMonth = `${monthNames[currentMonthIndex]} ${currentYear}`;
      projectedCategories.push(projectedMonth);
      
      // Project expenses (use last month's smoothed expenses, assume slight inflation ~2.4% annual = 0.2% monthly)
      // Compound inflation: each month expenses grow by 0.2%
      projectedExpenseBase = projectedExpenseBase * 1.002;
      projectedExpenses.push(projectedExpenseBase);
      
      // Project assets: Assets_n = Assets_{n-1} + MonthlySavings + (Assets_{n-1} * monthlyYield)
      // This accounts for: previous assets + new savings + growth on existing assets
      projectedAssets = projectedAssets + averageMonthlySavings + (projectedAssets * monthlyYield);
      
      // Projected passive income = Assets * monthlyYield
      const projectedPassiveIncome = projectedAssets * monthlyYield;
      projectedInterest.push(projectedPassiveIncome);
      
      // Find crossover point (first month where projected passive income >= projected expenses)
      if (!crossoverPoint && projectedPassiveIncome > 0 && projectedPassiveIncome >= projectedExpenseBase) {
        crossoverPoint = projectedMonth;
      }
    }
    
    // Calculate FI Percentage: (Latest Interest / Latest Expenses) * 100
    const latestInterest = historicalInterest.length > 0 ? historicalInterest[historicalInterest.length - 1] : 0;
    const latestExpenses = historicalExpenses.length > 0 ? historicalExpenses[historicalExpenses.length - 1] : 0;
    const fiPercentage = latestExpenses > 0 ? (latestInterest / latestExpenses) * 100 : 0;
    
    // Combine historical and projected categories
    const allCategories = [...historicalCategories, ...projectedCategories];
    
    return { 
      historicalInterest,
      historicalExpenses,
      projectedInterest,
      projectedExpenses,
      categories: allCategories,
      historicalCategories,
      projectedCategories,
      fiPercentage,
      crossoverPoint,
      currentYield: effectiveYield,
      averageMonthlySavings,
      currentAssets
    };
  }, [data.raw, userExpectedReturn]);

  // Prepare data for chart - combine historical and projected
  const allInterestData = [...chartData.historicalInterest, ...chartData.projectedInterest];
  const allExpensesData = [...chartData.historicalExpenses, ...chartData.projectedExpenses];
  
  // Find crossover point index for marker
  const crossoverIndex = chartData.crossoverPoint 
    ? chartData.categories.indexOf(chartData.crossoverPoint)
    : -1;
  
  // Create crossover marker data
  const crossoverMarkerData = crossoverIndex >= 0 
    ? chartData.categories.map((_, index) => index === crossoverIndex ? allInterestData[index] : null)
    : [];
  
  const historicalEndIndex = chartData.historicalCategories.length - 1;

  const wealthVelocityOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Wealth Velocity - Path to Financial Independence',
    },
    subtitle: chartData.crossoverPoint 
      ? { text: `🎉 Projected Retirement Day: ${chartData.crossoverPoint}` }
      : { text: 'Keep going! Your investment income is growing.' },
    xAxis: {
      categories: chartData.categories,
      crosshair: true,
      plotLines: [{
        value: historicalEndIndex,
        color: '#888',
        dashStyle: 'dash',
        width: 2,
        label: {
          text: 'Today',
          align: 'right',
          style: {
            color: '#888'
          }
        }
      }]
    },
    yAxis: {
      title: {
        text: `Amount (${currency})`,
      },
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        let tooltip = `<b>${this.x}</b><br/>`;
        const monthIndex = chartData.categories.indexOf(this.x as string);
        const isProjected = monthIndex > historicalEndIndex;
        const isHistorical = monthIndex <= historicalEndIndex;
        
        this.points?.forEach((point) => {
          const value = point.y as number;
          const isInterest = point.series.name?.includes('Interest') || point.series.name?.includes('Passive');
          
          if (isInterest && value === 0 && isHistorical) {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>No interest data recorded</b><br/>`;
          } else {
            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${formatNumber(value)} ${currency}</b>${isProjected ? ' (Projected)' : ''}<br/>`;
          }
        });
        
        if (monthIndex === crossoverIndex) {
          tooltip += `<br/><span style="color:#4ade80; font-weight: bold;">🎉 Cross-over Point: Financial Independence!</span>`;
        }
        
        return tooltip;
      },
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: 'Passive Income (Historical)',
        data: chartData.historicalInterest.map((val, idx) => ({
          y: val,
          marker: { enabled: false }
        })),
        color: '#4ade80',
        lineWidth: 3,
        dashStyle: 'Solid',
      },
      {
        name: 'Passive Income (Projected)',
        data: chartData.categories.map((_, idx) => {
          if (idx <= historicalEndIndex) return null;
          const projectedIdx = idx - chartData.historicalCategories.length;
          return {
            y: chartData.projectedInterest[projectedIdx],
            marker: { enabled: false }
          };
        }),
        color: '#4ade80',
        lineWidth: 3,
        dashStyle: 'Dash',
      },
      {
        name: 'Monthly Expenses (3-Month Avg)',
        data: allExpensesData.map((val, idx) => ({
          y: val,
          marker: { enabled: false }
        })),
        color: '#f87171',
        lineWidth: 3,
        dashStyle: 'Solid',
      },
      {
        name: 'Cross-over Point',
        data: crossoverMarkerData,
        type: 'scatter',
        color: '#ffd700',
        marker: {
          enabled: true,
          radius: 8,
          symbol: 'diamond',
        },
        enableMouseTracking: true,
      },
    ],
    plotOptions: {
      line: {
        marker: {
          enabled: false,
          radius: 3,
        },
      },
    },
  };

  if (!data.raw || data.raw.length === 0) {
    return null;
  }

  return (
    <>
      {/* Expected Return Input */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          color: '#a0a0a0',
          fontSize: '0.9rem'
        }}>
          Expected Annual Return: {formatNumber(chartData.currentYield * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.1"
          value={userExpectedReturn !== null ? userExpectedReturn * 100 : chartData.currentYield * 100}
          onChange={(e) => {
            const value = parseFloat(e.target.value) / 100;
            setUserExpectedReturn(value);
          }}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <span>0%</span>
          <span>10%</span>
          <span>20%</span>
        </div>
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: '#a0a0a0'
        }}>
          Adjust this slider to see how different return rates affect your path to financial independence.
        </div>
      </div>

      <HighchartsReact highcharts={Highcharts} options={wealthVelocityOptions} />
      <div style={{ 
        padding: '1rem', 
        fontSize: '0.9rem', 
        color: '#a0a0a0',
        lineHeight: '1.6'
      }}>
        <p><strong>Passive Income (Historical):</strong> Actual monthly income from investments (incomes tagged with #interest)</p>
        <p><strong>Passive Income (Projected):</strong> Projected monthly income based on current assets, savings rate, and expected return</p>
        <p><strong>Monthly Expenses:</strong> 3-month rolling average to smooth out volatility</p>
        {chartData.crossoverPoint && (
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#4ade80' }}>
            🎉 Projected Retirement Day: {chartData.crossoverPoint}
          </p>
        )}
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
          The point where Projected Passive Income crosses above Monthly Expenses is your "Retirement Day" - when your investments can fully cover your lifestyle.
        </p>
      </div>
    </>
  );
}
