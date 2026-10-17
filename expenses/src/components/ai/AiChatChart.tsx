import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ChatChart } from '../../ai/chart';

const formatAmount = (value: number, currency: string) =>
  `${Math.round(value).toLocaleString('ro-RO')} ${currency}`.trim();

const buildOptions = (spec: ChatChart): Highcharts.Options => {
  if (spec.type === 'pie') {
    return {
      chart: { type: 'pie', height: 240 },
      title: { text: spec.title },
      tooltip: {
        pointFormatter: function () {
          const pct = this.percentage != null ? `${this.percentage.toFixed(1)}%` : '';
          return `${pct}<br/>${formatAmount(this.y || 0, spec.currency)}`;
        },
      },
      plotOptions: {
        pie: {
          innerSize: '45%',
          dataLabels: {
            enabled: true,
            format: '{point.name}',
            distance: 12,
          },
        },
      },
      series: [
        {
          type: 'pie',
          name: spec.series[0].name,
          data: spec.categories.map((name, i) => ({
            name,
            y: spec.series[0].data[i],
          })),
        },
      ],
    };
  }

  return {
    chart: { type: spec.type, height: 220, zooming: { type: 'x' } },
    title: { text: spec.title },
    legend: { enabled: spec.series.length > 1 },
    xAxis: { categories: spec.categories, crosshair: true },
    yAxis: { title: { text: spec.currency } },
    tooltip: {
      shared: true,
      pointFormatter: function () {
        return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatAmount(this.y || 0, spec.currency)}</b><br/>`;
      },
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        stacking: spec.series.length > 1 ? 'normal' : undefined,
        colorByPoint: spec.series.length === 1,
      },
      line: {
        marker: { enabled: spec.categories.length <= 16 },
      },
    },
    series: spec.series.map((s) => ({
      type: spec.type,
      name: s.name,
      data: s.data,
    })),
  };
};

const AiChatChart: React.FC<{ spec: ChatChart }> = ({ spec }) => {
  const options = useMemo(() => buildOptions(spec), [spec]);
  return (
    <div className="ai-chat-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default AiChatChart;
