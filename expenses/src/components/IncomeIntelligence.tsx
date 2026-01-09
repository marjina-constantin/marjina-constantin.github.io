import React, { useMemo } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';
import { monthNames, incomeSuggestions } from '../utils/constants';
import { hasTag } from '../utils/utils';

// Map income suggestions to user-friendly labels
const incomeSourceLabels: Record<string, string> = {
  'salary': 'Salary',
  'bonus': 'Bonuses',
  'freelance': 'Freelance',
  'overtime': 'Overtime',
  'interest': 'Interest',
  'gift': 'Gifts',
  'cashback': 'Cashback',
  'sale': 'Sales',
  'loan': 'Loans',
};

export default function IncomeIntelligence() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  
  // Use filtered income data if available, otherwise use all income data
  const incomeData = data.filteredIncomeData !== null 
    ? (data.filteredIncomeData || [])
    : (data.incomeData || []);

  const chartData = useMemo(() => {
    if (!incomeData || incomeData.length === 0) {
      return {
        pieData: [],
        lineData: {},
        months: [],
      };
    }

    // Initialize totals for pie chart
    const sourceTotals: Record<string, number> = {};
    incomeSuggestions.forEach(tag => {
      const label = incomeSourceLabels[tag] || tag;
      sourceTotals[label] = 0;
    });
    let untaggedTotal = 0;

    // Initialize monthly data for line chart
    const monthlyData: Record<string, Record<string, number>> = {};
    const allMonths = new Set<string>();

    // Process each income item
    incomeData.forEach((item: TransactionOrIncomeItem) => {
      const amount = parseFloat(item.sum || '0');
      const date = new Date(item.dt);
      const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      allMonths.add(month);
      
      if (!monthlyData[month]) {
        monthlyData[month] = {};
        incomeSuggestions.forEach(tag => {
          const label = incomeSourceLabels[tag] || tag;
          monthlyData[month][label] = 0;
        });
        monthlyData[month]['untagged'] = 0;
      }

      // Check which source tag this item has
      let foundTag = false;
      for (const tag of incomeSuggestions) {
        if (item.dsc && hasTag(item.dsc, tag)) {
          const label = incomeSourceLabels[tag] || tag;
          sourceTotals[label] += amount;
          monthlyData[month][label] += amount;
          foundTag = true;
          break; // Only count first matching tag
        }
      }

      // If no tag found, count as untagged
      if (!foundTag) {
        untaggedTotal += amount;
        monthlyData[month]['untagged'] += amount;
      }
    });

    // Prepare pie chart data
    const pieData = incomeSuggestions
      .map(tag => {
        const label = incomeSourceLabels[tag] || tag;
        return {
          name: label,
          y: parseFloat(sourceTotals[label].toFixed(2)),
        };
      })
      .filter(item => item.y > 0);

    // Add untagged if there's any
    if (untaggedTotal > 0) {
      pieData.push({
        name: 'Untagged',
        y: parseFloat(untaggedTotal.toFixed(2)),
      });
    }

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
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

    // Prepare line chart series data
    // Only Salary and Interest should be visible by default
    const visibleByDefault = ['Salary', 'Interest'];
    
    const lineSeries = incomeSuggestions
      .map(tag => {
        const label = incomeSourceLabels[tag] || tag;
        const seriesData = sortedMonths.map(month => 
          parseFloat((monthlyData[month]?.[label] || 0).toFixed(2))
        );
        
        // Only include series that have data
        if (!seriesData.some(val => val > 0)) {
          return null;
        }
        
        return {
          name: label,
          data: seriesData,
          visible: visibleByDefault.includes(label),
        };
      })
      .filter(series => series !== null) as Array<{
        name: string;
        data: number[];
        visible: boolean;
      }>;

    // Add untagged series if there's any
    const untaggedSeriesData = sortedMonths.map(month => 
      parseFloat((monthlyData[month]?.['untagged'] || 0).toFixed(2))
    );
    if (untaggedSeriesData.some(val => val > 0)) {
      lineSeries.push({
        name: 'Untagged',
        data: untaggedSeriesData,
        visible: false, // Hide untagged by default
      });
    }

    return {
      pieData,
      lineSeries,
      months: sortedMonths,
    };
  }, [incomeData]);

  const pieOptions = {
    chart: {
      type: 'pie',
    },
    title: {
      text: 'Income Sources Breakdown',
    },
    tooltip: {
      pointFormat: '{point.y} {series.name} ({point.percentage:.2f})%',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        borderWidth: 0,
      },
    },
    series: [
      {
        name: currency,
        colorByPoint: true,
        data: chartData.pieData,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const lineOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Income Evolution by Source',
    },
    xAxis: {
      categories: chartData.months,
      crosshair: true,
    },
    yAxis: {
      title: {
        text: 'Amount',
      },
      min: 0,
    },
    tooltip: {
      shared: true,
      split: false,
    },
    plotOptions: {
      line: {
        marker: {
          enabled: true,
        },
      },
    },
    credits: {
      enabled: false,
    },
    series: chartData.lineSeries,
  };

  if (chartData.pieData.length === 0) {
    return (
      <div>
        <h3>Income Intelligence</h3>
        <p>No income data available. Add income entries with tags like #salary, #freelance, #bonus, #interest, or #refund.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <HighchartsReact highcharts={Highcharts} options={pieOptions} />
      </div>
      <div>
        <HighchartsReact highcharts={Highcharts} options={lineOptions} />
      </div>
    </div>
  );
}
