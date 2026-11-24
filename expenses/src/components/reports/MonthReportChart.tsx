import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { MonthReportFacts } from '../../ai/monthReport';

const formatAmount = (value: number, currency: string) =>
  `${Math.round(value).toLocaleString('en-US')} ${currency}`.trim();

const shortLabel: Record<string, string> = {
  'Medical / Healthcare': 'Health',
  'Household Items/Supplies': 'Household',
  Transportation: 'Transport',
  Entertainment: 'Fun',
};

const MonthReportChart: React.FC<{ facts: MonthReportFacts; currency: string }> = ({
  facts,
  currency,
}) => {
  const options = useMemo<Highcharts.Options>(() => {
    if (facts.chart.labels.length < 2) return {};
    const categories = facts.chart.labels.map((label) => shortLabel[label] || label);
    return {
      chart: {
        type: 'bar',
        height: Math.max(240, 88 + facts.chart.labels.length * 36),
      },
      title: { text: `${facts.label} vs 3-month average` },
      legend: { enabled: true },
      xAxis: { categories, title: { text: undefined } },
      yAxis: { title: { text: currency } },
      tooltip: {
        shared: true,
        pointFormatter: function () {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatAmount(
            this.y || 0,
            currency
          )}</b><br/>`;
        },
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
          grouping: true,
          groupPadding: 0.12,
          pointPadding: 0.08,
        },
      },
      series: [
        { type: 'bar', name: facts.label, data: facts.chart.spent },
        { type: 'bar', name: '3-month average', data: facts.chart.average },
      ],
    };
  }, [currency, facts]);

  if (facts.chart.labels.length < 2) return null;

  return (
    <div className="month-report__chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default MonthReportChart;
